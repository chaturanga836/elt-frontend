/**
 * Copy text to the clipboard.
 *
 * navigator.clipboard only works reliably in a secure context (HTTPS / localhost).
 * On plain HTTP (e.g. http://<public-ip>) and some Brave builds, writeText can
 * resolve without throwing and without updating the clipboard — so we skip it
 * outside secure contexts and use a textarea + execCommand fallback.
 */
export async function copyToClipboard(text: string): Promise<void> {
  const secure =
    typeof window !== 'undefined' &&
    typeof window.isSecureContext === 'boolean' &&
    window.isSecureContext;

  if (
    secure &&
    typeof navigator !== 'undefined' &&
    navigator.clipboard?.writeText
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to legacy path.
    }
  }

  await legacyCopy(text);
}

function legacyCopy(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.setAttribute('aria-hidden', 'true');
    // Keep the node selectable; opacity:0 / display:none breaks Brave/Safari.
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';

    document.body.appendChild(textarea);

    const previous = document.activeElement as HTMLElement | null;
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    let ok = false;
    try {
      // Document.execCommand is deprecated in lib.dom typings (TS6385) but remains
      // the only reliable clipboard fallback outside secure contexts.
      const legacy = (
        document as unknown as { execCommand: (commandId: string) => boolean }
      ).execCommand.bind(document);
      ok = legacy('copy');
    } finally {
      document.body.removeChild(textarea);
      previous?.focus?.({ preventScroll: true });
    }

    if (!ok) {
      reject(new Error('Clipboard copy failed'));
      return;
    }
    resolve();
  });
}
