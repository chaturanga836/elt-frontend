// src/lib/validateExternalUrls.ts
/**
 * Client-side URL detection for code editors.
 * Provides instant feedback before server-side validation.
 */

export interface UrlViolation {
  url: string;
  line: number;
  startCol: number;
  endCol: number;
}

// Colon must be allowed so host:port URLs (e.g. http://172.17.0.1:8088) are not truncated.
const URL_REGEX = /https?:\/\/[^\s"'`)\]}>,;]+/gi;

const ALWAYS_ALLOWED_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(:\d+)?(\/.*)?$/i;

/**
 * Scans code for external URLs and returns violations with line/column info.
 * Pass `allowedUrls` to whitelist registered external links.
 */
export function detectExternalUrls(
  code: string,
  allowedUrls: string[] = [],
): UrlViolation[] {
  if (!code) return [];

  const normalizedAllowed = new Set(
    allowedUrls.map((u) => u.replace(/\/+$/, '').toLowerCase()),
  );

  const violations: UrlViolation[] = [];
  const lines = code.split('\n');

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    let match: RegExpExecArray | null;
    URL_REGEX.lastIndex = 0;

    while ((match = URL_REGEX.exec(line)) !== null) {
      const url = match[0];

      if (ALWAYS_ALLOWED_REGEX.test(url)) continue;

      const urlNormalized = url.replace(/\/+$/, '').toLowerCase();

      // Check exact match
      if (normalizedAllowed.has(urlNormalized)) continue;

      // Check if it's a sub-path of an allowed base URL
      const isSubpath = [...normalizedAllowed].some((allowed) =>
        urlNormalized.startsWith(allowed),
      );
      if (isSubpath) continue;

      violations.push({
        url,
        line: lineIdx + 1,
        startCol: match.index + 1,
        endCol: match.index + url.length + 1,
      });
    }
  }

  return violations;
}

/**
 * Quick check — returns true if code contains any unauthorized URLs.
 */
export function hasExternalUrls(code: string, allowedUrls: string[] = []): boolean {
  return detectExternalUrls(code, allowedUrls).length > 0;
}
