'use client';

import Keycloak, { KeycloakInstance, KeycloakInitOptions, KeycloakProfile } from 'keycloak-js';
import { isAccessTokenExpiringSoon } from '@/lib/jwt';

const KEYCLOAK_URL = (process.env.NEXT_PUBLIC_KC_URL || 'http://localhost:8081').replace(/\/$/, '');
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KC_REALM || 'workspace-realm';
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KC_CLIENT_ID || 'workspace-web';

const AUTH_STATE_KEY = 'kc_manual_auth_state';

type ManualAuthState = {
  state: string;
  redirectUri: string;
};

let keycloak: KeycloakInstance | null = null;

/** Web Crypto subtle is only available in secure contexts (HTTPS or localhost). */
export function isSecureAuthContext(): boolean {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext && typeof crypto?.subtle !== 'undefined';
}

function isNonLocalHttpKeycloak(): boolean {
  try {
    const parsed = new URL(KEYCLOAK_URL);
    if (parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    return !['localhost', '127.0.0.1', '::1'].includes(host);
  } catch {
    return KEYCLOAK_URL.startsWith('http://');
  }
}

/**
 * Use manual OAuth flow for non-HTTPS Keycloak deployments.
 * keycloak-js flow may fail in this mode and can trigger HTTPS-required screens.
 */
export function shouldUseManualAuthFlow(): boolean {
  return !isSecureAuthContext() || isNonLocalHttpKeycloak();
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

export function getKeycloakClient(): KeycloakInstance {
  if (!keycloak) {
    keycloak = new Keycloak({
      url: KEYCLOAK_URL,
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

/** OAuth redirect without PKCE — works on http://IP:port (no Web Crypto). */
export function loginWithoutPkce(redirectUri?: string): void {
  const redirect = redirectUri || getManualCallbackRedirectUri();
  const state = randomString();

  const stored: ManualAuthState = { state, redirectUri: redirect };
  sessionStorage.setItem(AUTH_STATE_KEY, JSON.stringify(stored));

  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: redirect,
    response_type: 'code',
    scope: 'openid',
    state,
    response_mode: 'query',
  });

  const url = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth?${params}`;
  window.location.assign(url);
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
  const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: KEYCLOAK_CLIENT_ID,
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(tokenUrl, {
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

function persistTokens(tokens: TokenResponse): string {
  localStorage.setItem('token', tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }
  return tokens.access_token;
}

export async function exchangeRefreshToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: KEYCLOAK_CLIENT_ID,
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenUrl, {
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

/** Refresh access token using stored refresh_token (manual OAuth / HTTP deployments). */
export async function refreshManualAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  try {
    const tokens = await exchangeRefreshToken(refreshToken);
    return persistTokens(tokens);
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    return null;
  }
}

/** Returns a valid access token, refreshing when near expiry (manual flow). */
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
  return refreshed ?? existing;
}

/** Complete manual OAuth callback; returns true if this page was a callback. */
export async function completeManualOAuthCallback(): Promise<boolean> {
  const parsed = parseOAuthCallbackFromUrl();
  if (!parsed) return false;

  const raw = sessionStorage.getItem(AUTH_STATE_KEY);
  if (!raw) {
    throw new Error('Missing login state. Start sign-in again from /login.');
  }

  const expected: ManualAuthState = JSON.parse(raw);
  if (parsed.state !== expected.state) {
    throw new Error('Invalid OAuth state.');
  }

  const tokens = await exchangeCodeForTokens(parsed.code, expected.redirectUri);
  sessionStorage.removeItem(AUTH_STATE_KEY);
  persistTokens(tokens);

  window.history.replaceState({}, '', '/auth/callback');
  return true;
}

export async function initializeKeycloak(): Promise<boolean> {
  if (shouldUseManualAuthFlow()) {
    return Boolean(localStorage.getItem('token'));
  }

  const client = getKeycloakClient();
  return client.init(getInitOptions('check-sso'));
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
  await client.login({ redirectUri: redirect });
}

export async function logoutFromKeycloak(redirectUri?: string): Promise<void> {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  sessionStorage.removeItem(AUTH_STATE_KEY);

  const postLogout = redirectUri || `${window.location.origin}/login`;

  if (shouldUseManualAuthFlow()) {
    const params = new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      post_logout_redirect_uri: postLogout,
    });
    window.location.assign(
      `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout?${params}`,
    );
    return;
  }

  const client = getKeycloakClient();
  await client.logout({ redirectUri: postLogout });
}

export async function loadUserProfile(): Promise<KeycloakProfile | null> {
  if (shouldUseManualAuthFlow()) {
    const token = await ensureValidAccessToken();
    if (!token) return null;
    const res = await fetch(
      `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return null;
    const info = await res.json();
    return {
      id: info.sub,
      username: info.preferred_username,
      email: info.email,
      firstName: info.given_name,
      lastName: info.family_name,
    } as KeycloakProfile;
  }

  const client = getKeycloakClient();
  if (!client.authenticated) return null;
  return client.loadUserProfile();
}

export async function refreshTokenIfNeeded(): Promise<string | null> {
  if (shouldUseManualAuthFlow()) {
    return ensureValidAccessToken();
  }

  const existing = localStorage.getItem('token');
  const client = getKeycloakClient();
  if (!client.authenticated) return existing;
  await client.updateToken(30);
  const token = client.token || null;
  if (token) localStorage.setItem('token', token);
  return token;
}
