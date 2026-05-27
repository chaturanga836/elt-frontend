'use client';

import Keycloak, { KeycloakInstance, KeycloakInitOptions, KeycloakProfile } from 'keycloak-js';

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

function applyNoPkce(client: KeycloakInstance): void {
  client.pkceMethod = false;
}

export function getKeycloakClient(): KeycloakInstance {
  if (!keycloak) {
    keycloak = new Keycloak({
      url: KEYCLOAK_URL,
      realm: KEYCLOAK_REALM,
      clientId: KEYCLOAK_CLIENT_ID,
    });
    applyNoPkce(keycloak);
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

  localStorage.setItem('token', tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }

  window.history.replaceState({}, '', '/auth/callback');
  return true;
}

export async function initializeKeycloak(): Promise<boolean> {
  if (!isSecureAuthContext()) {
    return Boolean(localStorage.getItem('token'));
  }

  const client = getKeycloakClient();
  applyNoPkce(client);
  return client.init(getInitOptions('check-sso'));
}

export async function loginWithKeycloak(redirectUri?: string): Promise<void> {
  const redirect = redirectUri || getManualCallbackRedirectUri();

  if (!isSecureAuthContext()) {
    loginWithoutPkce(redirect);
    return;
  }

  const client = getKeycloakClient();
  applyNoPkce(client);
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

  if (!isSecureAuthContext()) {
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
  applyNoPkce(client);
  await client.logout({ redirectUri: postLogout });
}

export async function loadUserProfile(): Promise<KeycloakProfile | null> {
  if (!isSecureAuthContext()) {
    const token = localStorage.getItem('token');
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
  const existing = localStorage.getItem('token');
  if (!isSecureAuthContext()) {
    return existing;
  }

  const client = getKeycloakClient();
  applyNoPkce(client);
  if (!client.authenticated) return existing;
  await client.updateToken(30);
  const token = client.token || null;
  if (token) localStorage.setItem('token', token);
  return token;
}
