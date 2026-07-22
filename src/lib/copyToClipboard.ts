import copy from 'copy-to-clipboard';

/**
 * Copy text to the clipboard using copy-to-clipboard (handles HTTPS, HTTP,
 * Brave, and inputs/modals via execCommand fallback + selection restore).
 */
export async function copyToClipboard(text: string): Promise<void> {
  const ok = await copy(text);
  if (!ok) {
    throw new Error('Clipboard copy failed');
  }
}
