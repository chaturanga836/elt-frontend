/**
 * Release images bake NEXT_PUBLIC_* URLs with localhost. On a customer host,
 * swap only the hostname for window.location.hostname — keep port and path.
 */

function isLocalHostname(host: string): boolean {
  return ['localhost', '127.0.0.1', '::1'].includes(host.toLowerCase());
}

export function resolvePublicUrlFromLocalhostDefault(
  configuredUrl: string,
  fallbackPath = '',
): string {
  const configured = configuredUrl.trim().replace(/\/$/, '');
  if (typeof window === 'undefined') {
    return configured || fallbackPath;
  }
  if (!configured) {
    return `${window.location.origin}${fallbackPath}`;
  }

  try {
    const parsed = new URL(configured);
    const pageHost = window.location.hostname;
    if (isLocalHostname(parsed.hostname) && !isLocalHostname(pageHost)) {
      parsed.hostname = pageHost;
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return `${window.location.origin}${fallbackPath}`;
  }
}

export function resolvePublicKeycloakBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_KC_URL || 'http://localhost:8081';
  if (typeof window !== 'undefined') {
    try {
      const parsed = new URL(configured);
      const pageHost = window.location.hostname;
      const localHosts = ['localhost', '127.0.0.1', '::1'];
      const cfgIsLocal = localHosts.includes(parsed.hostname.toLowerCase());
      const pageIsLocal = localHosts.includes(pageHost.toLowerCase());
      if ((cfgIsLocal && !pageIsLocal) || (parsed.port === '8081' && !pageIsLocal)) {
        return window.location.origin;
      }
    } catch {
      /* fall through */
    }
  }
  const resolved = resolvePublicUrlFromLocalhostDefault(configured);
  try {
    return new URL(resolved).origin;
  } catch {
    return resolved;
  }
}

export function resolvePublicApiBaseUrl(): string {
  return resolvePublicUrlFromLocalhostDefault(
    process.env.NEXT_PUBLIC_API_URL || '',
    '/api/v1',
  );
}
