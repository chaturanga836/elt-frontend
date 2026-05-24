import { v4 as uuidv4 } from 'uuid';

/**
 * Stable ID for React keys / form rows.
 * crypto.randomUUID() is only available in secure contexts (HTTPS, localhost).
 * Production over plain HTTP (e.g. http://13.x.x.x:3000) must use a fallback.
 */
export function generateId(): string {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  return uuidv4();
}
