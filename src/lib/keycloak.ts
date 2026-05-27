'use client';

import Keycloak, { KeycloakInstance, KeycloakProfile } from 'keycloak-js';

let keycloak: KeycloakInstance | null = null;

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KC_URL || 'http://localhost:8081';
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KC_REALM || 'workspace-realm';
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KC_CLIENT_ID || 'workspace-web';

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
  const authenticated = await client.init({
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    checkLoginIframe: false,
  });
  return authenticated;
}

export async function loginWithKeycloak(redirectUri?: string): Promise<void> {
  const client = getKeycloakClient();
  await client.login({
    redirectUri: redirectUri || window.location.origin,
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
