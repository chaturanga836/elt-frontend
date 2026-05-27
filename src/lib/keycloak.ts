'use client';

import Keycloak, { KeycloakInstance, KeycloakInitOptions, KeycloakProfile } from 'keycloak-js';

let keycloak: KeycloakInstance | null = null;

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KC_URL || 'http://localhost:8081';
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KC_REALM || 'workspace-realm';
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KC_CLIENT_ID || 'workspace-web';

/** PKCE (S256) needs Web Crypto — only available on HTTPS or http://localhost */
function canUsePkce(): boolean {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext && typeof crypto?.subtle !== 'undefined';
}

function getInitOptions(onLoad: KeycloakInitOptions['onLoad'] = 'check-sso'): KeycloakInitOptions {
  return {
    onLoad,
    checkLoginIframe: false,
    ...(canUsePkce() ? { pkceMethod: 'S256' } : { pkceMethod: false }),
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

export async function initializeKeycloak(): Promise<boolean> {
  const client = getKeycloakClient();
  return client.init(getInitOptions('check-sso'));
}

export async function loginWithKeycloak(redirectUri?: string): Promise<void> {
  const client = getKeycloakClient();
  // Ensure init ran with correct PKCE setting before building the login URL
  if (!client.didInitialize) {
    await client.init(getInitOptions('login-required'));
  }
  await client.login({
    redirectUri: redirectUri || `${window.location.origin}/auth/callback`,
  });
}

export async function logoutFromKeycloak(redirectUri?: string): Promise<void> {
  const client = getKeycloakClient();
  await client.logout({
    redirectUri: redirectUri || `${window.location.origin}/login`,
  });
}

export async function loadUserProfile(): Promise<KeycloakProfile | null> {
  const client = getKeycloakClient();
  if (!client.authenticated) return null;
  return client.loadUserProfile();
}

export async function refreshTokenIfNeeded(): Promise<string | null> {
  const client = getKeycloakClient();
  if (!client.authenticated) return null;
  await client.updateToken(30);
  return client.token || null;
}
