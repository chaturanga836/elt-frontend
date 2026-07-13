'use client';

import Keycloak, { type KeycloakInitOptions, type KeycloakProfile } from 'keycloak-js';
import { isAccessTokenExpiringSoon, parseJwtPayload } from '@/lib/jwt';
import { resolvePublicKeycloakBaseUrl } from '@/lib/publicUrls';

const CONFIGURED_KC_URL = (process.env.NEXT_PUBLIC_KC_URL || 'http://localhost:8081').replace(
  /\/$/,
  '',
);
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KC_REALM || 'workspace-realm';
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KC_CLIENT_ID || 'workspace-web';
const OIDC_SCOPES = 'openid profile email';
const AUTH_STATE_KEY = 'kc_manual_auth_state';
const TOKEN_ISSUED_AT_KEY = 'token_issued_at';
const REFRESH_GRACE_MS = 60_000;
const KC_DEBUG_KEY = 'kc_auth_debug';

export type KeycloakAuthDiagnostics = {
  configuredKcUrl: string;
  resolvedBaseUrl: string;
  authEndpoint: string;
  pageOrigin: string;
  useManualFlow: boolean;
  sameOriginKeycloak: boolean;
};

function emitKeycloakDebug(event: string, data: Record<string, unknown>): void {
  const payload = { event, ...data, at: new Date().toISOString() };
  // Visible in browser DevTools on any host (remote EC2 installs included).
  console.info('[KC-DEBUG]', payload);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(KC_DEBUG_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota / private mode */
    }
  }
  // #region agent log
  fetch('http://127.0.0.1:7374/ingest/7236c4a4-2c67-4e6d-9829-8b8c4f1ddb6a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'82f026'},body:JSON.stringify({sessionId:'82f026',location:`keycloak.ts:${event}`,message:event,data,timestamp:Date.now(),hypothesisId:'A-E'})}).catch(()=>{});
  // #endregion
}

export function getKeycloakAuthDiagnostics(): KeycloakAuthDiagnostics {
  const resolvedBaseUrl = typeof window === 'undefined' ? CONFIGURED_KC_URL : getKeycloakBaseUrl();
  return {
    configuredKcUrl: CONFIGURED_KC_URL,
    resolvedBaseUrl,
    authEndpoint: `${resolvedBaseUrl}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`,
    pageOrigin: typeof window !== 'undefined' ? window.location.origin : '',
    useManualFlow: typeof window !== 'undefined' ? shouldUseManualAuthFlow() : false,
    sameOriginKeycloak: typeof window !== 'undefined' ? isSameOriginKeycloak() : false,
  };
}

export function readLastKeycloakDebug(): KeycloakAuthDiagnostics | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KC_DEBUG_KEY);
    return raw ? (JSON.parse(raw) as KeycloakAuthDiagnostics) : null;
  } catch {
    return null;
  }
}

type ManualAuthState = {
  state: string;
  redirectUri: string;
};

let keycloak: Keycloak | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let oauthCallbackInFlight: Promise<boolean> | null = null;

/** Keycloak base URL — same origin via nginx /realms/ on customer hosts. */
export function getKeycloakBaseUrl(): string {
  if (typeof window === 'undefined') {
    return CONFIGURED_KC_URL;
  }

  const pageOrigin = window.location.origin;
  const pageHost = window.location.hostname;
  const localHosts = ['localhost', '127.0.0.1', '::1'];
  const pageIsLocal = localHosts.includes(pageHost.toLowerCase());

  // Remote installs: nginx proxies Keycloak at /realms/ on the same host as the UI.
  // Never use baked localhost:8081 from release images on a customer EC2 host.
  if (!pageIsLocal) {
    emitKeycloakDebug('getKeycloakBaseUrl', {
      configured: CONFIGURED_KC_URL,
      resolved: pageOrigin,
      pageOrigin,
      pageHost,
      strategy: 'same-origin-proxy',
    });
    return pageOrigin;
  }

  let resolved = CONFIGURED_KC_URL;
  try {
    const cfg = new URL(CONFIGURED_KC_URL);
    const cfgIsLocal = localHosts.includes(cfg.hostname.toLowerCase());
    if (cfgIsLocal || cfg.port === '8081') {
      resolved = pageOrigin;
    }
  } catch {
    resolved = resolvePublicKeycloakBaseUrl();
  }
  emitKeycloakDebug('getKeycloakBaseUrl', {
    configured: CONFIGURED_KC_URL,
    resolved,
    pageOrigin,
    pageHost,
    strategy: 'local-dev',
  });
  return resolved;
}

function isSameOriginKeycloak(): boolean {
  if (typeof window === 'undefined') return false;
  return getKeycloakBaseUrl() === window.location.origin;
}

/** Web Crypto subtle is only available in secure contexts (HTTPS or localhost). */
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
 * Manual OAuth for plain HTTP Keycloak. HTTPS production uses keycloak-js
 * (token exchange via the library; profile from JWT only).
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

function authEndpoint(): string {
  return `${getKeycloakBaseUrl()}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`;
}

function tokenEndpoint(): string {
  if (isSameOriginKeycloak()) {
    return `/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  }
  return `${getKeycloakBaseUrl()}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
}

function logoutEndpoint(): string {
  return `${getKeycloakBaseUrl()}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`;
}

function syncKeycloakTokensToStorage(client: Keycloak): string | null {
  const token = client.token ?? null;
  if (token) {
    localStorage.setItem('token', token);
  }
  if (client.refreshToken) {
    localStorage.setItem('refresh_token', client.refreshToken);
  }
  if (token) {
    markTokenIssuedNow();
  }
  return token;
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

  const authUrl = `${authEndpoint()}?${params}`;
  emitKeycloakDebug('loginWithoutPkce', {
    authUrl,
    configuredKcUrl: CONFIGURED_KC_URL,
    resolvedBase: getKeycloakBaseUrl(),
    redirect,
    useManualFlow: shouldUseManualAuthFlow(),
  });
  window.location.href = authUrl;
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
  return `${authEndpoint()}?${params}`;
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

  const response = await fetch(tokenEndpoint(), {
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
};

export function clearStoredTokens(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem(TOKEN_ISSUED_AT_KEY);
}

export function clearOAuthState(): void {
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
  return Number.isFinite(issuedAt) && Date.now() - issuedAt < REFRESH_GRACE_MS;
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

  const response = await fetch(tokenEndpoint(), {
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

  if (isFreshlyIssuedToken() || !isAccessTokenExpiringSoon(existing, 30)) {
    return existing;
  }

  return refreshManualAccessToken();
}

function readOAuthState(): string | null {
  return sessionStorage.getItem(AUTH_STATE_KEY) || localStorage.getItem(AUTH_STATE_KEY);
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
      persistTokens(tokens);
      window.history.replaceState({}, '', '/auth/callback');
      clearOAuthState();
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
  if (client.didInitialize) {
    if (client.token) {
      syncKeycloakTokensToStorage(client);
    }
    return client.authenticated ?? Boolean(client.token);
  }

  const authenticated = await client.init(getInitOptions('check-sso'));
  if (client.token) {
    syncKeycloakTokensToStorage(client);
  }
  return authenticated;
}

export async function loginWithKeycloak(redirectUri?: string): Promise<void> {
  const redirect = redirectUri || getManualCallbackRedirectUri();

  if (shouldUseManualAuthFlow()) {
    clearStoredTokens();
    clearOAuthState();
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
  clearStoredTokens();
  clearOAuthState();

  const postLogout = redirectUri || `${window.location.origin}/login`;

  if (shouldUseManualAuthFlow()) {
    const params = new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      post_logout_redirect_uri: postLogout,
    });
    window.location.assign(`${logoutEndpoint()}?${params}`);
    return;
  }

  const client = getKeycloakClient();
  if (client.authenticated) {
    await client.logout({ redirectUri: postLogout });
    return;
  }

  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    post_logout_redirect_uri: postLogout,
  });
  window.location.assign(`${logoutEndpoint()}?${params}`);
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
  const token = await ensureValidAccessToken();
  if (!token) return null;
  return profileFromAccessToken(token);
}

export async function refreshTokenIfNeeded(): Promise<string | null> {
  if (shouldUseManualAuthFlow()) {
    return ensureValidAccessToken();
  }

  const client = getKeycloakClient();
  if (!client.authenticated) {
    return localStorage.getItem('token');
  }

  try {
    await client.updateToken(30);
  } catch {
    clearStoredTokens();
    return null;
  }

  return syncKeycloakTokensToStorage(client);
}
