'use client';

import { type KeycloakProfile } from 'keycloak-js';
import { isAccessTokenExpiringSoon, parseJwtPayload } from '@/lib/jwt';

const KEYCLOAK_URL = (process.env.NEXT_PUBLIC_KC_URL || 'http://localhost:8081').replace(/\/$/, '');
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

function keycloakHostname(): string {
  try {
    return new URL(KEYCLOAK_URL).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/** Accept same realm on the same host (http/https or port differences behind a proxy). */
function isAcceptedTokenIssuer(iss: string): boolean {
  const realmSuffix = `/realms/${KEYCLOAK_REALM}`;
  if (!iss.endsWith(realmSuffix)) return false;
  try {
    return new URL(iss).hostname.toLowerCase() === keycloakHostname();
  } catch {
    return iss === `${KEYCLOAK_URL}${realmSuffix}`;
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

/** OAuth redirect without PKCE — works on http://IP:port (no Web Crypto). */
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

  const url = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth?${params}`;
  window.location.assign(url);
}

export function getKeycloakForgotPasswordUrl(redirectUri?: string): string {
  const redirect = redirectUri || `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/login`;
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: redirect,
    response_type: 'code',
    scope: OIDC_SCOPES,
    kc_action: 'RESET_CREDENTIALS',
  });
  return `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth?${params}`;
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

/** Prevents parallel refresh calls from invalidating each other's tokens in Keycloak. */
let refreshInFlight: Promise<string | null> | null = null;

/** Prevents duplicate OAuth callback handling (e.g. React Strict Mode double-mount). */
let oauthCallbackInFlight: Promise<boolean> | null = null;

export function clearStoredTokens(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem(TOKEN_ISSUED_AT_KEY);
}

/** Drop tokens issued for a different Keycloak realm/host. */
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
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    try {
      const tokens = await exchangeRefreshToken(refreshToken);
      return persistTokens(tokens);
    } catch {
      // Rotation may have invalidated this refresh token; do not reuse a possibly inactive access token.
      clearStoredTokens();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Resolve the access token to send on API requests (manual or keycloak-js). */
export async function resolveAccessToken(): Promise<string | null> {
  return ensureValidAccessToken();
}

/** Returns a valid access token, refreshing when near expiry (manual flow). */
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

/** Complete manual OAuth callback; returns true if this page was a callback. */
export async function completeManualOAuthCallback(): Promise<boolean> {
  if (oauthCallbackInFlight) {
    return oauthCallbackInFlight;
  }

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
        // React Strict Mode or a duplicate callback may have already exchanged this code.
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

export async function loginWithKeycloak(redirectUri?: string): Promise<void> {
  const redirect = redirectUri || getManualCallbackRedirectUri();
  loginWithoutPkce(redirect);
}

export async function logoutFromKeycloak(redirectUri?: string): Promise<void> {
  clearStoredTokens();
  clearOAuthState();

  const postLogout = redirectUri || `${window.location.origin}/login`;
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    post_logout_redirect_uri: postLogout,
  });
  window.location.assign(
    `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout?${params}`,
  );
}

/** Profile from JWT claims — avoids Keycloak userinfo (fails when session/token is inactive). */
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
