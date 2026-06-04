import type { AxiosError } from 'axios';

/** Turn FastAPI / API error payloads into a safe string for UI (never pass objects to React). */
export function formatErrorDetail(detail: unknown): string {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          const msg = rec.msg != null ? String(rec.msg) : JSON.stringify(item);
          const loc = Array.isArray(rec.loc) ? rec.loc.join('.') : '';
          return loc ? `${loc}: ${msg}` : msg;
        }
        return String(item);
      })
      .join('; ');
  }
  if (typeof detail === 'object') {
    const rec = detail as Record<string, unknown>;
    if (typeof rec.message === 'string') return rec.message;
    try {
      return JSON.stringify(detail);
    } catch {
      return 'Request failed';
    }
  }
  return String(detail);
}

export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (!error || typeof error !== 'object') {
    return error != null ? String(error) : fallback;
  }

  const axiosErr = error as AxiosError<{ detail?: unknown; message?: string }>;
  const data = axiosErr.response?.data;

  if (data && typeof data === 'object') {
    if ('detail' in data && data.detail != null) {
      const formatted = formatErrorDetail(data.detail);
      if (formatted) return formatted;
    }
    if (typeof data.message === 'string' && data.message) {
      return data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
