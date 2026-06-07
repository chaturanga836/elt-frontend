export type ParsedScriptError = {
  summary: string;
  exceptionType: string | null;
  message: string | null;
  lineNumber: number | null;
  lineHint: string | null;
  traceback: string;
};

const FILE_LINE_RE = /File\s+"[^"]*",\s*line\s+(\d+)/g;
const SYNTAX_LINE_RE = /line\s+(\d+)/i;

/** Parse sandbox / script error text into a short summary + line number when present. */
export function parseScriptError(raw: unknown): ParsedScriptError | null {
  if (raw == null) return null;
  const traceback = typeof raw === 'string' ? raw.trim() : String(raw).trim();
  if (!traceback) return null;

  const lines = traceback.split(/\r?\n/).filter(Boolean);
  const firstLine = lines[0] || traceback;

  let exceptionType: string | null = null;
  let message: string | null = null;
  const excMatch = firstLine.match(/^([A-Za-z_][\w.]*(?::\s.*)?)$/);
  if (excMatch) {
    const parts = firstLine.split(':', 2);
    exceptionType = parts[0]?.trim() || null;
    message = parts[1]?.trim() || firstLine;
  } else {
    message = firstLine;
  }

  let lineNumber: number | null = null;
  let lineHint: string | null = null;
  const fileMatches = [...traceback.matchAll(FILE_LINE_RE)];
  if (fileMatches.length > 0) {
    const last = fileMatches[fileMatches.length - 1];
    lineNumber = Number(last[1]);
    const ctxIndex = lines.findIndex((l) => l.includes(`line ${lineNumber}`));
    if (ctxIndex >= 0 && lines[ctxIndex + 1]) {
      lineHint = lines[ctxIndex + 1].trim();
    }
  } else {
    const syntaxMatch = traceback.match(SYNTAX_LINE_RE);
    if (syntaxMatch) {
      lineNumber = Number(syntaxMatch[1]);
    }
  }

  const summaryParts = [
    exceptionType || 'Error',
    lineNumber != null ? `line ${lineNumber}` : null,
    message,
  ].filter(Boolean);

  return {
    summary: summaryParts.join(' — '),
    exceptionType,
    message,
    lineNumber,
    lineHint,
    traceback,
  };
}

export function globalsDiffKeys(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): string[] {
  const prev = before || {};
  const next = after || {};
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
      changed.push(key);
    }
  }
  return changed.sort();
}
