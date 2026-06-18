'use client';

import Keycloak, { type KeycloakInitOptions, type KeycloakProfile } from 'keycloak-js';
import { isAccessTokenExpiringSoon, parseJwtPayload } from '@/lib/jwt';

const CONFIGURED_KC_URL = (process.env.NEXT_PUBLIC_KC_URL || 'http://localhost:8081').replace(
  /\/$/,
  '',
);
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KC_REALM || 'workspace-realm';
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KC_CLIENT_ID || 'workspace-web';
const OIDC_SCOPES = 'openid profile email';

const AUTH_STATE_KEY = 'kc_manual_auth_state';

type ManualAuthState = {
  state: string;
  redirectUri: string;
};

let keycloak: Keycloak | null = null;

let refreshInFlight: Promise<string | null> | null = null;
let oauthCallbackInFlight: Promise<boolean> | null = null;

/** Same host behind nginx :443 — use browser origin, not a stale :8081 build URL. */
export function getKeycloakBaseUrl(): string {
  if (typeof window === 'undefined') return CONFIGURED_KC_URL;
  try {
    const cfgHost = new URL(CONFIGURED_KC_URL).hostname.toLowerCase();
    if (cfgHost === window.location.hostname.toLowerCase()) {
      return window.location.origin;
    }
  } catch {
    /* use configured */
  }
  return CONFIGURED_KC_URL;
}

function realmOidcUrl(suffix: string): string {
  return `${getKeycloakBaseUrl()}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/${suffix}`;
}

export function isSecureAuthContext(): boolean {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext && typeof crypto?.subtle !== 'undefined';
}

function isNonLocalHttpKeycloak(): boolean {
  try {
    const parsed = new URL(CONFIGURED_KC_URL);
    if (parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    return !['localhost', '127.0.0.1', '::1'].includes(host);
  } catch {
    return CONFIGURED_KC_URL.startsWith('http://');
  }
}

/**
 * Manual OAuth only for plain HTTP. HTTPS (incl. :443 reverse proxy) uses keycloak-js.
 */
export function shouldUseManualAuthFlow(): boolean {
  if (!isSecureAuthContext()) return true;

  if (typeof window !== 'undefined') {
    try {
      const cfg = new URL(CONFIGURED_KC_URL);
      if (cfg.hostname.toLowerCase() === window.location.hostname.toLowerCase()) {
        return false;
      }
      if (cfg.protocol === 'https:') return false;
    } catch {
      /* fall through */
    }
  }

  return isNonLocalHttpKeycloak();
}

function randomString(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getInitOptions(onLoad: KeycloakInitOptions['onLoad'] = 'check-sso'): KeycloakInitOptions {
  return {
    onLoad,
    checkLoginIframe: false,
    pkceMethod: false,
  };
}

export function getKeycloakClient(): Keycloak {
  if (!keycloak) {
    keycloak = new Keycloak({
      url: getKeycloakBaseUrl(),
      realm: KEYCLOAK_REALM,
      clientId: KEYCLOAK_CLIENT_ID,
    });
  }
  return keycloak;
}

export function getManualCallbackRedirectUri(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000/auth/callback';
  }
  return `${window.location.origin}/auth/callback`;
}

export function loginWithoutPkce(redirectUri?: string): void {
  const redirect = redirectUri || getManualCallbackRedirectUri();
  const state = randomString();

  const stored: ManualAuthState = { state, redirectUri: redirect };
  const serialized = JSON.stringify(stored);
  sessionStorage.setItem(AUTH_STATE_KEY, serialized);
  localStorage.setItem(AUTH_STATE_KEY, serialized);

  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: redirect,
    response_type: 'code',
    scope: OIDC_SCOPES,
    state,
    response_mode: 'query',
  });

  window.location.assign(`${realmOidcUrl('auth')}?${params}`);
}

export function getKeycloakForgotPasswordUrl(redirectUri?: string): string {
  const redirect =
    redirectUri ||
    `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/login`;
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: redirect,
    response_type: 'code',
    scope: OIDC_SCOPES,
    kc_action: 'RESET_CREDENTIALS',
  });
  return `${realmOidcUrl('auth')}?${params}`;
}

export function redirectToKeycloakForgotPassword(redirectUri?: string): void {
  window.location.assign(getKeycloakForgotPasswordUrl(redirectUri));
}

export function parseOAuthCallbackFromUrl(): { code: string; state: string } | null {
  if (typeof window === 'undefined') return null;

  const fromQuery = new URLSearchParams(window.location.search);
  let code = fromQuery.get('code');
  let state = fromQuery.get('state');

  if (!code && window.location.hash) {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    code = hash.get('code');
    state = hash.get('state');
  }

  if (!code || !state) return null;
  return { code, state };
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string; refresh_token?: string; id_token?: string }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: KEYCLOAK_CLIENT_ID,
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(realmOidcUrl('token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  return response.json();
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
};

export function clearStoredTokens(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
}

function persistTokens(tokens: TokenResponse): string {
  localStorage.setItem('token', tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }
  return tokens.access_token;
}

export function storeAuthTokens(accessToken: string, refreshToken?: string): void {
  persistTokens({ access_token: accessToken, refresh_token: refreshToken });
}

export async function exchangeRefreshToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: KEYCLOAK_CLIENT_ID,
    refresh_token: refreshToken,
  });

  const response = await fetch(realmOidcUrl('token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Refresh token failed (${response.status}): ${text}`);
  }

  return response.json();
}

export async function refreshManualAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    try {
      const tokens = await exchangeRefreshToken(refreshToken);
      return persistTokens(tokens);
    } catch {
      const current = localStorage.getItem('token');
      if (current && !isAccessTokenExpiringSoon(current, 0)) {
        return current;
      }
      clearStoredTokens();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function resolveAccessToken(): Promise<string | null> {
  if (shouldUseManualAuthFlow()) {
    return ensureValidAccessToken();
  }
  return (await refreshTokenIfNeeded()) || localStorage.getItem('token');
}

export async function ensureValidAccessToken(): Promise<string | null> {
  const existing = localStorage.getItem('token');
  if (!existing) return null;

  if (!shouldUseManualAuthFlow()) {
    return refreshTokenIfNeeded();
  }

  if (!isAccessTokenExpiringSoon(existing, 30)) {
    return existing;
  }

  const refreshed = await refreshManualAccessToken();
  if (refreshed) return refreshed;
  if (!isAccessTokenExpiringSoon(existing, 0)) return existing;
  return null;
}

function readOAuthState(): string | null {
  return sessionStorage.getItem(AUTH_STATE_KEY) || localStorage.getItem(AUTH_STATE_KEY);
}

function clearOAuthState(): void {
  sessionStorage.removeItem(AUTH_STATE_KEY);
  localStorage.removeItem(AUTH_STATE_KEY);
}

export async function completeManualOAuthCallback(): Promise<boolean> {
  if (oauthCallbackInFlight) return oauthCallbackInFlight;

  oauthCallbackInFlight = (async () => {
    try {
      const parsed = parseOAuthCallbackFromUrl();
      if (!parsed) return false;

      const raw = readOAuthState();
      if (!raw) {
        throw new Error('Missing login state. Start sign-in again from /login.');
      }

      const expected: ManualAuthState = JSON.parse(raw);
      if (parsed.state !== expected.state) {
        throw new Error('Invalid OAuth state.');
      }

      const tokens = await exchangeCodeForTokens(parsed.code, expected.redirectUri);
      clearOAuthState();
      persistTokens(tokens);
      window.history.replaceState({}, '', '/auth/callback');
      return true;
    } finally {
      oauthCallbackInFlight = null;
    }
  })();

  return oauthCallbackInFlight;
}

export async function initializeKeycloak(): Promise<boolean> {
  if (shouldUseManualAuthFlow()) {
    return Boolean(localStorage.getItem('token'));
  }

  const client = getKeycloakClient();
  const hasCallback = Boolean(parseOAuthCallbackFromUrl());
  const authenticated = await client.init(
    getInitOptions(hasCallback ? 'login-required' : 'check-sso'),
  );

  if (client.token) localStorage.setItem('token', client.token);
  if (client.refreshToken) localStorage.setItem('refresh_token', client.refreshToken);

  return authenticated;
}

export async function loginWithKeycloak(redirectUri?: string): Promise<void> {
  const redirect = redirectUri || getManualCallbackRedirectUri();

  if (shouldUseManualAuthFlow()) {
    loginWithoutPkce(redirect);
    return;
  }

  const client = getKeycloakClient();
  if (!client.didInitialize) {
    await client.init(getInitOptions('check-sso'));
  }
  await client.login({ redirectUri: redirect, scope: OIDC_SCOPES });
}

export async function logoutFromKeycloak(redirectUri?: string): Promise<void> {
  clearStoredTokens();
  clearOAuthState();

  const postLogout = redirectUri || `${window.location.origin}/login`;

  if (shouldUseManualAuthFlow()) {
    const params = new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      post_logout_redirect_uri: postLogout,
    });
    window.location.assign(`${realmOidcUrl('logout')}?${params}`);
    return;
  }

  const client = getKeycloakClient();
  await client.logout({ redirectUri: postLogout });
}

/** Profile from JWT — never calls Keycloak /account or /userinfo. */
export function profileFromAccessToken(token: string): KeycloakProfile | null {
  const payload = parseJwtPayload(token);
  if (!payload?.sub) return null;
  return {
    id: payload.sub,
    username: payload.preferred_username,
    email: payload.email,
    firstName: payload.given_name,
    lastName: payload.family_name,
  } as KeycloakProfile;
}

export async function loadUserProfile(): Promise<KeycloakProfile | null> {
  const token = await resolveAccessToken();
  if (!token) return null;
  return profileFromAccessToken(token);
}

export async function refreshTokenIfNeeded(): Promise<string | null> {
  if (shouldUseManualAuthFlow()) {
    return ensureValidAccessToken();
  }

  const client = getKeycloakClient();
  if (!client.authenticated && !client.token) {
    return localStorage.getItem('token');
  }

  try {
    await client.updateToken(30);
  } catch {
    return localStorage.getItem('token');
  }

  const token = client.token || null;
  if (token) localStorage.setItem('token', token);
  return token;
}
