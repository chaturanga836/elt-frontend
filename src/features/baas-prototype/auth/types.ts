export type AuthProviderId = 'oauth2' | 'keycloak' | 'github' | 'google';

export type OAuth2AuthConfig = {
  enabled: boolean;
  displayName: string;
  grantType: 'authorization_code' | 'pkce' | 'client_credentials' | 'password';
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  refreshUrl: string;
  callbackUrl: string;
  scopes: string;
  clientAuthMethod: 'client_secret_post' | 'basic_auth';
};

export type PackagedAuthConfig = {
  enabled: boolean;
  displayName: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  scopes: string;
  /** Keycloak-only */
  realm?: string;
  serverUrl?: string;
};

export type AuthProviderConfigMap = {
  oauth2: OAuth2AuthConfig;
  keycloak: PackagedAuthConfig;
  github: PackagedAuthConfig;
  google: PackagedAuthConfig;
};

export const AUTH_PROVIDER_META: Record<
  AuthProviderId,
  {
    label: string;
    description: string;
    packageName?: string;
  }
> = {
  oauth2: {
    label: 'OAuth 2',
    description:
      'Configure a generic OAuth 2.0 identity provider with your own authorize and token endpoints.',
  },
  keycloak: {
    label: 'Keycloak',
    description: 'Sign users in with Keycloak using the DT Orch Keycloak auth package.',
    packageName: '@dtorch/auth-keycloak',
  },
  github: {
    label: 'GitHub',
    description: 'Sign users in with GitHub using the DT Orch GitHub auth package.',
    packageName: '@dtorch/auth-github',
  },
  google: {
    label: 'Google',
    description: 'Sign users in with Google using the DT Orch Google auth package.',
    packageName: '@dtorch/auth-google',
  },
};

export const DEFAULT_AUTH_CONFIGS: AuthProviderConfigMap = {
  oauth2: {
    enabled: false,
    displayName: 'OAuth 2',
    grantType: 'authorization_code',
    clientId: '',
    clientSecret: '',
    authUrl: '',
    tokenUrl: '',
    refreshUrl: '',
    callbackUrl: '',
    scopes: 'openid email profile',
    clientAuthMethod: 'client_secret_post',
  },
  keycloak: {
    enabled: false,
    displayName: 'Keycloak',
    clientId: '',
    clientSecret: '',
    callbackUrl: '',
    scopes: 'openid email profile',
    realm: '',
    serverUrl: '',
  },
  github: {
    enabled: false,
    displayName: 'GitHub',
    clientId: '',
    clientSecret: '',
    callbackUrl: '',
    scopes: 'read:user user:email',
  },
  google: {
    enabled: false,
    displayName: 'Google',
    clientId: '',
    clientSecret: '',
    callbackUrl: '',
    scopes: 'openid email profile',
  },
};
