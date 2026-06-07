/** UI column map: table column -> upstream input field (null = unmapped). */
export type DbColumnMapUi = Record<string, string | null>;

export function emptyColumnMap(columns: string[]): DbColumnMapUi {
  const map: DbColumnMapUi = {};
  for (const col of columns) {
    map[col] = null;
  }
  return map;
}

/** Convert stored backend map (source -> db column) into UI map keyed by table columns. */
export function backendToUiColumnMap(
  backend: Record<string, string> | undefined,
  columns: string[],
): DbColumnMapUi {
  const sourceByColumn: Record<string, string> = {};
  if (backend) {
    for (const [source, column] of Object.entries(backend)) {
      sourceByColumn[column] = source;
    }
  }
  const map: DbColumnMapUi = {};
  for (const col of columns) {
    map[col] = sourceByColumn[col] ?? null;
  }
  return map;
}

/** Convert UI map to backend format, omitting unmapped columns. */
export function uiToBackendColumnMap(ui: DbColumnMapUi): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [column, source] of Object.entries(ui)) {
    const trimmed = (source ?? '').trim();
    if (trimmed) {
      out[trimmed] = column;
    }
  }
  return out;
}

export function mergeColumnMapWithColumns(
  columns: string[],
  existing: DbColumnMapUi | undefined,
): DbColumnMapUi {
  const map = emptyColumnMap(columns);
  if (existing) {
    for (const col of columns) {
      if (col in existing && existing[col] != null && existing[col] !== '') {
        map[col] = existing[col];
      }
    }
  }
  return map;
}
