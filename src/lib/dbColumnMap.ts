export type DbColumnMapMode = 'skip' | 'field' | 'literal' | 'global';

export type DbColumnMapEntry =
  | { mode: 'skip' }
  | { mode: 'field'; source: string }
  | { mode: 'literal'; value: string }
  | { mode: 'global'; key: string };

/** UI state keyed by table column name. */
export type DbColumnMapUi = Record<string, DbColumnMapEntry>;

export type StoredColumnMapping = {
  mode: 'field' | 'literal' | 'global';
  source?: string;
  value?: string;
  key?: string;
};

export type StoredColumnMappings = Record<string, StoredColumnMapping>;

export const SKIP_COLUMN_MAP_ENTRY: DbColumnMapEntry = { mode: 'skip' };

export function emptyColumnMap(columns: string[]): DbColumnMapUi {
  const map: DbColumnMapUi = {};
  for (const col of columns) {
    map[col] = { mode: 'skip' };
  }
  return map;
}

function legacyColumnMapToStored(
  legacy: Record<string, string> | undefined,
): StoredColumnMappings {
  const out: StoredColumnMappings = {};
  if (!legacy) return out;
  for (const [source, column] of Object.entries(legacy)) {
    out[column] = { mode: 'field', source };
  }
  return out;
}

export function storedToUiColumnMap(
  stored: StoredColumnMappings | undefined,
  legacyColumnMap: Record<string, string> | undefined,
  columns: string[],
): DbColumnMapUi {
  const byColumn = stored && Object.keys(stored).length
    ? stored
    : legacyColumnMapToStored(legacyColumnMap);

  const map = emptyColumnMap(columns);
  for (const col of columns) {
    const spec = byColumn[col];
    if (!spec) continue;
    if (spec.mode === 'literal') {
      map[col] = { mode: 'literal', value: String(spec.value ?? '') };
    } else if (spec.mode === 'global') {
      map[col] = { mode: 'global', key: String(spec.key ?? '') };
    } else if (spec.mode === 'field' && spec.source) {
      map[col] = { mode: 'field', source: spec.source };
    }
  }
  return map;
}

export function uiToStoredColumnMap(ui: DbColumnMapUi): StoredColumnMappings | undefined {
  const out: StoredColumnMappings = {};
  for (const [column, entry] of Object.entries(ui)) {
    if (entry.mode === 'field') {
      const source = entry.source.trim();
      if (source) out[column] = { mode: 'field', source };
    } else if (entry.mode === 'literal') {
      out[column] = { mode: 'literal', value: entry.value };
    } else if (entry.mode === 'global') {
      const key = entry.key.trim();
      if (key) out[column] = { mode: 'global', key };
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** @deprecated use storedToUiColumnMap */
export function backendToUiColumnMap(
  backend: Record<string, string> | undefined,
  columns: string[],
): DbColumnMapUi {
  return storedToUiColumnMap(undefined, backend, columns);
}

/** @deprecated use uiToStoredColumnMap */
export function uiToBackendColumnMap(ui: DbColumnMapUi): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [column, entry] of Object.entries(ui)) {
    if (entry.mode === 'field') {
      const source = entry.source.trim();
      if (source) out[source] = column;
    }
  }
  return out;
}

export function hasActiveColumnMapping(ui: DbColumnMapUi): boolean {
  return Object.values(ui).some((entry) => entry.mode !== 'skip');
}
