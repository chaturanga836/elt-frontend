'use client';

import { type KeycloakProfile } from 'keycloak-js';
import { isAccessTokenExpiringSoon, parseJwtPayload } from '@/lib/jwt';

const CONFIGURED_KC_URL = (process.env.NEXT_PUBLIC_KC_URL || 'http://localhost:8081').replace(
  /\/$/,
  '',
);
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KC_REALM || 'workspace-realm';
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KC_CLIENT_ID || 'workspace-web';
const OIDC_SCOPES = 'openid profile email';
const TOKEN_ISSUED_AT_KEY = 'token_issued_at';
const REFRESH_GRACE_MS = 60_000;
const AUTH_STATE_KEY = 'kc_manual_auth_state';

type ManualAuthState = {
  state: string;
  redirectUri: string;
};

type KeycloakEndpoints = {
  auth: string;
  token: string;
  logout: string;
};

function configuredKeycloakHost(): string {
  try {
    return new URL(CONFIGURED_KC_URL).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/** Same host on :443 reverse proxy — use browser origin, not a stale build-time port. */
function isSameHostAsApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cfgHost = configuredKeycloakHost();
  if (!cfgHost) return true;
  return cfgHost === window.location.hostname.toLowerCase();
}

/** Resolve Keycloak endpoints at runtime (critical for HTTPS :443 behind nginx). */
export function getKeycloakEndpoints(): KeycloakEndpoints {
  const realmPath = `/realms/${KEYCLOAK_REALM}/protocol/openid-connect`;

  if (typeof window !== 'undefined' && isSameHostAsApp()) {
    const origin = window.location.origin.replace(/\/$/, '');
    return {
      auth: `${origin}${realmPath}/auth`,
      token: `${realmPath}/token`,
      logout: `${origin}${realmPath}/logout`,
    };
  }

  const base = CONFIGURED_KC_URL;
  return {
    auth: `${base}${realmPath}/auth`,
    token: `${base}${realmPath}/token`,
    logout: `${base}${realmPath}/logout`,
  };
}

function isAcceptedTokenIssuer(iss: string): boolean {
  if (!iss.endsWith(`/realms/${KEYCLOAK_REALM}`)) return false;
  if (typeof window === 'undefined') return true;
  try {
    return new URL(iss).hostname.toLowerCase() === window.location.hostname.toLowerCase();
  } catch {
    return false;
  }
}

function randomString(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getManualCallbackRedirectUri(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000/auth/callback';
  }
  return `${window.location.origin}/auth/callback`;
}

export function beginKeycloakLogin(): void {
  clearStoredTokens();
  loginWithoutPkce();
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

  window.location.href = `${getKeycloakEndpoints().auth}?${params}`;
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
  return `${getKeycloakEndpoints().auth}?${params}`;
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

  const response = await fetch(getKeycloakEndpoints().token, {
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

let refreshInFlight: Promise<string | null> | null = null;
let oauthCallbackInFlight: Promise<boolean> | null = null;

export function clearStoredTokens(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem(TOKEN_ISSUED_AT_KEY);
}

function discardTokenIfIssuerMismatch(token: string | null): string | null {
  if (!token) return null;
  const iss = parseJwtPayload(token)?.iss;
  if (iss && !isAcceptedTokenIssuer(iss)) {
    clearStoredTokens();
    return null;
  }
  return token;
}

function readOAuthState(): string | null {
  return sessionStorage.getItem(AUTH_STATE_KEY) || localStorage.getItem(AUTH_STATE_KEY);
}

function clearOAuthState(): void {
  sessionStorage.removeItem(AUTH_STATE_KEY);
  localStorage.removeItem(AUTH_STATE_KEY);
}

function markTokenIssuedNow(): void {
  localStorage.setItem(TOKEN_ISSUED_AT_KEY, String(Date.now()));
}

function isFreshlyIssuedToken(): boolean {
  const raw = localStorage.getItem(TOKEN_ISSUED_AT_KEY);
  if (!raw) return false;
  const issuedAt = Number(raw);
  if (!Number.isFinite(issuedAt)) return false;
  return Date.now() - issuedAt < REFRESH_GRACE_MS;
}

function persistTokens(tokens: TokenResponse): string {
  localStorage.setItem('token', tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }
  markTokenIssuedNow();
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

  const response = await fetch(getKeycloakEndpoints().token, {
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
      clearStoredTokens();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function resolveAccessToken(): Promise<string | null> {
  return ensureValidAccessToken();
}

export async function ensureValidAccessToken(): Promise<string | null> {
  const existing = discardTokenIfIssuerMismatch(localStorage.getItem('token'));
  if (!existing) return null;

  if (isFreshlyIssuedToken() || !isAccessTokenExpiringSoon(existing, 30)) {
    return existing;
  }

  return refreshManualAccessToken();
}

function finishOAuthCallbackUrl(): void {
  window.history.replaceState({}, '', '/auth/callback');
  clearOAuthState();
}

function hasValidStoredAccessToken(): boolean {
  const token = discardTokenIfIssuerMismatch(localStorage.getItem('token'));
  return Boolean(token && !isAccessTokenExpiringSoon(token, 0));
}

export async function completeManualOAuthCallback(): Promise<boolean> {
  if (oauthCallbackInFlight) return oauthCallbackInFlight;

  oauthCallbackInFlight = (async () => {
    try {
      const parsed = parseOAuthCallbackFromUrl();
      if (!parsed) return false;

      if (hasValidStoredAccessToken()) {
        finishOAuthCallbackUrl();
        return true;
      }

      const raw = readOAuthState();
      if (!raw) {
        throw new Error('Missing login state. Start sign-in again from /login.');
      }

      const expected: ManualAuthState = JSON.parse(raw);
      if (parsed.state !== expected.state) {
        throw new Error('Invalid OAuth state.');
      }

      try {
        const tokens = await exchangeCodeForTokens(parsed.code, expected.redirectUri);
        finishOAuthCallbackUrl();
        persistTokens(tokens);
        return true;
      } catch (error) {
        if (hasValidStoredAccessToken()) {
          finishOAuthCallbackUrl();
          return true;
        }
        throw error;
      }
    } finally {
      oauthCallbackInFlight = null;
    }
  })();

  return oauthCallbackInFlight;
}

export async function initializeKeycloak(): Promise<boolean> {
  return Boolean(discardTokenIfIssuerMismatch(localStorage.getItem('token')));
}

export function loginWithKeycloak(redirectUri?: string): void {
  if (redirectUri) {
    clearStoredTokens();
    loginWithoutPkce(redirectUri);
    return;
  }
  beginKeycloakLogin();
}

export async function logoutFromKeycloak(redirectUri?: string): Promise<void> {
  clearStoredTokens();
  clearOAuthState();

  const postLogout = redirectUri || `${window.location.origin}/login`;
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    post_logout_redirect_uri: postLogout,
  });
  window.location.assign(`${getKeycloakEndpoints().logout}?${params}`);
}

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
  const token = await ensureValidAccessToken();
  if (!token) return null;
  return profileFromAccessToken(token);
}

export async function refreshTokenIfNeeded(): Promise<string | null> {
  return ensureValidAccessToken();
}
