import {
  AuthProviderConfigMap,
  AuthProviderId,
  DEFAULT_AUTH_CONFIGS,
} from './types';

const storageKey = (workspaceId: number, provider: AuthProviderId) =>
  `dtorch.auth-provider.${workspaceId}.${provider}`;

export function loadAuthProviderConfig<T extends AuthProviderId>(
  workspaceId: number,
  provider: T,
): AuthProviderConfigMap[T] {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_AUTH_CONFIGS[provider] };
  }
  try {
    const raw = window.localStorage.getItem(storageKey(workspaceId, provider));
    if (!raw) return { ...DEFAULT_AUTH_CONFIGS[provider] };
    return {
      ...DEFAULT_AUTH_CONFIGS[provider],
      ...JSON.parse(raw),
    };
  } catch {
    return { ...DEFAULT_AUTH_CONFIGS[provider] };
  }
}

export function saveAuthProviderConfig<T extends AuthProviderId>(
  workspaceId: number,
  provider: T,
  config: AuthProviderConfigMap[T],
): void {
  window.localStorage.setItem(storageKey(workspaceId, provider), JSON.stringify(config));
}
