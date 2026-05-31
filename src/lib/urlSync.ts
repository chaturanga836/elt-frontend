import { KeyValuePair } from '@/types/restForm';
import { generateId } from '@/lib/generateId';

/** Encode for query strings but leave {{var}} placeholders readable (backend resolves them). */
export function encodePreservingVariables(part: string): string {
  if (!part) return '';
  const segments = part.split(/(\{\{[^}]+\}\})/g);
  return segments
    .map((segment) => {
      if (/^\{\{[^}]+\}\}$/.test(segment)) return segment;
      return encodeURIComponent(segment);
    })
    .join('');
}

export function stripQuery(url: string): string {
  if (!url) return '';
  const idx = url.indexOf('?');
  return idx === -1 ? url : url.slice(0, idx);
}

export function paramsToQueryString(params: KeyValuePair[]): string {
  const active = params.filter((p) => p.key && p.enabled);
  if (active.length === 0) return '';
  return active
    .map(
      (p) =>
        `${encodePreservingVariables(p.key!)}=${encodePreservingVariables(p.value ?? '')}`,
    )
    .join('&');
}

export function buildUrlWithParams(baseUrl: string, params: KeyValuePair[]): string {
  const base = stripQuery(baseUrl.trim());
  const qs = paramsToQueryString(params);
  if (!base) return qs ? `?${qs}` : '';
  return qs ? `${base}?${qs}` : base;
}

export function parseQueryToPairs(queryString: string): Array<{ key: string; value: string }> {
  if (!queryString.trim()) return [];
  const pairs: Array<{ key: string; value: string }> = [];
  const searchParams = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
  searchParams.forEach((value, key) => pairs.push({ key, value }));
  return pairs;
}

export function parseFullUrl(raw: string): { baseUrl: string; queryPairs: Array<{ key: string; value: string }> } {
  const value = raw.trim().replace(/^['"]+|['"]+$/g, '');
  if (!value) return { baseUrl: '', queryPairs: [] };

  if (value.startsWith('?') || (value.includes('=') && !value.includes('://') && !value.startsWith('/'))) {
    const qs = value.startsWith('?') ? value.slice(1) : value;
    return { baseUrl: '', queryPairs: parseQueryToPairs(qs) };
  }

  const qIndex = value.indexOf('?');
  if (qIndex === -1) {
    return { baseUrl: value, queryPairs: [] };
  }

  return {
    baseUrl: value.slice(0, qIndex),
    queryPairs: parseQueryToPairs(value.slice(qIndex + 1)),
  };
}

export function mergeParamsFromQuery(
  existing: KeyValuePair[],
  queryPairs: Array<{ key: string; value: string }>,
): KeyValuePair[] {
  if (queryPairs.length === 0) {
    return existing.some((p) => p.key) ? [] : existing;
  }

  const byKey = new Map(existing.filter((p) => p.key).map((p) => [p.key!, p]));
  const merged: KeyValuePair[] = queryPairs.map(({ key, value }) => {
    const prev = byKey.get(key);
    return {
      uiId: prev?.uiId ?? generateId(),
      id: prev?.id ?? null,
      key,
      value,
      enabled: true,
    };
  });

  merged.push({
    uiId: generateId(),
    id: null,
    key: '',
    value: '',
    enabled: true,
  });

  return merged;
}

export function extractRelativePath(fullBaseUrl: string, groupBaseUrl: string | null): string {
  if (!groupBaseUrl || !fullBaseUrl) return '';
  try {
    const full = new URL(stripQuery(fullBaseUrl));
    const base = new URL(stripQuery(groupBaseUrl));
    if (full.origin === base.origin && full.pathname.startsWith(base.pathname)) {
      const rel = full.pathname.slice(base.pathname.length);
      return rel.startsWith('/') ? rel : rel ? `/${rel}` : '';
    }
  } catch {
    /* fall through */
  }
  return '';
}

export function seedGroupAuthParams(
  groupAuthType: number,
  groupAuthConfig: Record<string, unknown>,
): KeyValuePair[] {
  if (groupAuthType !== 4 || !groupAuthConfig) return [];
  if ((groupAuthConfig.addTo as string) !== 'query') return [];
  const key = groupAuthConfig.key as string;
  if (!key) return [];
  return [
    {
      uiId: generateId(),
      id: null,
      key,
      value: (groupAuthConfig.value as string) || '',
      enabled: true,
    },
  ];
}
