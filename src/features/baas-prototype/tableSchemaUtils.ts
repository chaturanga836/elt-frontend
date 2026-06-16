import {
  WorkspaceDatabaseTableColumn,
  WorkspaceDatabaseTableDetail,
  WorkspaceDatabaseTableForeignKey,
  WorkspaceDatabaseTableIndex,
} from '@/services/workspaceDatabase.service';

export type ColumnBaseType =
  | 'SERIAL'
  | 'INTEGER'
  | 'BIGINT'
  | 'TEXT'
  | 'VARCHAR'
  | 'CHAR'
  | 'BOOLEAN'
  | 'TIMESTAMPTZ'
  | 'JSONB'
  | 'NUMERIC';

export type ColumnDef = {
  key: string;
  name: string;
  baseType: ColumnBaseType;
  length?: number;
  precision?: number;
  scale?: number;
  nullable: boolean;
  primaryKey: boolean;
  defaultValue: string;
};

export type IndexDef = {
  key: string;
  name: string;
  columns: string[];
  unique: boolean;
  existing?: boolean;
};

export type ForeignKeyDef = {
  key: string;
  name: string;
  localColumn: string;
  refTable: string;
  refColumn: string;
  onDelete: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'NO ACTION';
  existing?: boolean;
};

export type TableSchemaState = {
  tableName: string;
  columns: ColumnDef[];
  indexes: IndexDef[];
  foreignKeys: ForeignKeyDef[];
};

export const COLUMN_BASE_TYPES: ColumnBaseType[] = [
  'SERIAL',
  'INTEGER',
  'BIGINT',
  'TEXT',
  'VARCHAR',
  'CHAR',
  'BOOLEAN',
  'TIMESTAMPTZ',
  'JSONB',
  'NUMERIC',
];

export const TYPE_HAS_LENGTH: Record<ColumnBaseType, boolean> = {
  SERIAL: false,
  INTEGER: false,
  BIGINT: false,
  TEXT: false,
  VARCHAR: true,
  CHAR: true,
  BOOLEAN: false,
  TIMESTAMPTZ: false,
  JSONB: false,
  NUMERIC: true,
};

export const ON_DELETE_OPTIONS = ['CASCADE', 'RESTRICT', 'SET NULL', 'NO ACTION'] as const;

const TYPE_PARSE_RE = /^([A-Z]+)(?:\((\d+)(?:,\s*(\d+))?\))?$/i;

export function parseColumnType(type: string): {
  baseType: ColumnBaseType;
  length?: number;
  precision?: number;
  scale?: number;
} {
  const normalized = type.trim().toUpperCase();
  const match = normalized.match(TYPE_PARSE_RE);
  if (!match) {
    return { baseType: 'TEXT' };
  }
  const base = match[1] as ColumnBaseType;
  const first = match[2] ? Number(match[2]) : undefined;
  const second = match[3] ? Number(match[3]) : undefined;
  if (base === 'NUMERIC' && first !== undefined) {
    return { baseType: base, precision: first, scale: second ?? 0 };
  }
  if (TYPE_HAS_LENGTH[base] && first !== undefined) {
    return { baseType: base, length: first };
  }
  if (COLUMN_BASE_TYPES.includes(base)) {
    return { baseType: base };
  }
  return { baseType: 'TEXT' };
}

export function formatColumnType(col: Pick<ColumnDef, 'baseType' | 'length' | 'precision' | 'scale'>): string {
  if (col.baseType === 'NUMERIC' && col.precision !== undefined) {
    const scale = col.scale ?? 0;
    return `NUMERIC(${col.precision},${scale})`;
  }
  if (TYPE_HAS_LENGTH[col.baseType] && col.length !== undefined) {
    return `${col.baseType}(${col.length})`;
  }
  return col.baseType;
}

function columnSqlLine(col: ColumnDef): string {
  const typeSql = formatColumnType(col);
  let line = `  ${col.name.trim()} ${typeSql}`;
  if (col.primaryKey && col.baseType !== 'SERIAL') line += ' PRIMARY KEY';
  if (!col.nullable) line += ' NOT NULL';
  if (col.defaultValue.trim()) line += ` DEFAULT ${col.defaultValue.trim()}`;
  return line;
}

function fkConstraintLine(fk: ForeignKeyDef, schemaName: string): string {
  const onDelete = fk.onDelete !== 'NO ACTION' ? ` ON DELETE ${fk.onDelete}` : '';
  return `  CONSTRAINT ${fk.name.trim()} FOREIGN KEY (${fk.localColumn}) REFERENCES ${schemaName}.${fk.refTable} (${fk.refColumn})${onDelete}`;
}

let keyCounter = 0;
export function nextKey(prefix: string): string {
  keyCounter += 1;
  return `${prefix}-${keyCounter}`;
}

export function newColumn(overrides?: Partial<ColumnDef>): ColumnDef {
  return {
    key: nextKey('col'),
    name: '',
    baseType: 'TEXT',
    length: undefined,
    nullable: true,
    primaryKey: false,
    defaultValue: '',
    ...overrides,
  };
}

export function newIndex(): IndexDef {
  return { key: nextKey('idx'), name: '', columns: [], unique: false };
}

export function newForeignKey(): ForeignKeyDef {
  return {
    key: nextKey('fk'),
    name: '',
    localColumn: '',
    refTable: '',
    refColumn: '',
    onDelete: 'NO ACTION',
  };
}

export function defaultCreateState(): TableSchemaState {
  return {
    tableName: '',
    columns: [newColumn({ name: 'id', baseType: 'SERIAL', nullable: false, primaryKey: true })],
    indexes: [],
    foreignKeys: [],
  };
}

export function stateFromTableDetail(detail: WorkspaceDatabaseTableDetail): TableSchemaState {
  return {
    tableName: detail.table_name,
    columns: detail.columns.map((col) => {
      const parsed = parseColumnType(col.type);
      return {
        key: nextKey('col'),
        name: col.name,
        baseType: parsed.baseType,
        length: parsed.length ?? (parsed.baseType === 'VARCHAR' ? 255 : parsed.baseType === 'CHAR' ? 1 : undefined),
        precision: parsed.precision,
        scale: parsed.scale,
        nullable: col.nullable,
        primaryKey: col.primary_key,
        defaultValue: col.default ?? '',
      };
    }),
    indexes: (detail.indexes ?? []).map((idx) => ({
      key: nextKey('idx'),
      name: idx.name,
      columns: idx.columns,
      unique: idx.unique,
      existing: true,
    })),
    foreignKeys: (detail.foreign_keys ?? []).map((fk) => ({
      key: nextKey('fk'),
      name: fk.name,
      localColumn: fk.constrained_columns[0] ?? '',
      refTable: fk.referred_table,
      refColumn: fk.referred_columns[0] ?? '',
      onDelete: (fk.on_delete as ForeignKeyDef['onDelete']) ?? 'NO ACTION',
      existing: true,
    })),
  };
}

export function buildCreateTableSql(
  schemaName: string,
  state: TableSchemaState,
): string {
  const safeName = state.tableName.trim() || 'new_table';
  const namedColumns = state.columns.filter((c) => c.name.trim());
  if (namedColumns.length === 0) {
    return '-- Add at least one column to generate DDL';
  }

  const columnLines = namedColumns.map(columnSqlLine);
  const fkLines = state.foreignKeys
    .filter((fk) => fk.name.trim() && fk.localColumn && fk.refTable && fk.refColumn)
    .map((fk) => fkConstraintLine(fk, schemaName));

  const body = [...columnLines, ...fkLines].join(',\n');
  const createTable = `CREATE TABLE IF NOT EXISTS ${safeName} (\n${body}\n);`;

  const indexStatements = state.indexes
    .filter((idx) => idx.name.trim() && idx.columns.length > 0)
    .map((idx) => {
      const unique = idx.unique ? 'UNIQUE ' : '';
      const cols = idx.columns.join(', ');
      return `CREATE ${unique}INDEX IF NOT EXISTS ${idx.name.trim()} ON ${safeName} (${cols});`;
    });

  return [createTable, ...indexStatements].join('\n\n');
}

function columnChanged(a: WorkspaceDatabaseTableColumn, b: ColumnDef): boolean {
  const parsed = parseColumnType(a.type);
  return (
    a.name !== b.name.trim() ||
    parsed.baseType !== b.baseType ||
    (parsed.length ?? undefined) !== (b.length ?? undefined) ||
    (parsed.precision ?? undefined) !== (b.precision ?? undefined) ||
    (parsed.scale ?? undefined) !== (b.scale ?? undefined) ||
    a.nullable !== b.nullable ||
    a.primary_key !== b.primaryKey ||
    (a.default ?? '') !== b.defaultValue.trim()
  );
}

export function buildAlterTableSql(
  original: WorkspaceDatabaseTableDetail,
  state: TableSchemaState,
): string {
  const table = original.table_name;
  const statements: string[] = [];

  const originalByName = new Map(original.columns.map((c) => [c.name, c]));
  const nextByName = new Map(state.columns.filter((c) => c.name.trim()).map((c) => [c.name.trim(), c]));

  for (const col of state.columns) {
    const name = col.name.trim();
    if (!name) continue;
    const prev = originalByName.get(name);
    if (!prev) {
      statements.push(`ALTER TABLE ${table} ADD COLUMN ${columnSqlLine(col).trim()};`);
    } else if (columnChanged(prev, col)) {
      const typeSql = formatColumnType(col);
      statements.push(`ALTER TABLE ${table} ALTER COLUMN ${name} TYPE ${typeSql};`);
      if (prev.nullable !== col.nullable) {
        statements.push(
          `ALTER TABLE ${table} ALTER COLUMN ${name} ${col.nullable ? 'DROP NOT NULL' : 'SET NOT NULL'};`,
        );
      }
      if ((prev.default ?? '') !== col.defaultValue.trim()) {
        if (col.defaultValue.trim()) {
          statements.push(
            `ALTER TABLE ${table} ALTER COLUMN ${name} SET DEFAULT ${col.defaultValue.trim()};`,
          );
        } else {
          statements.push(`ALTER TABLE ${table} ALTER COLUMN ${name} DROP DEFAULT;`);
        }
      }
    }
  }

  for (const orig of original.columns) {
    if (!nextByName.has(orig.name)) {
      statements.push(`ALTER TABLE ${table} DROP COLUMN ${orig.name};`);
    }
  }

  for (const idx of state.indexes) {
    if (idx.existing || !idx.name.trim() || idx.columns.length === 0) continue;
    const unique = idx.unique ? 'UNIQUE ' : '';
    statements.push(
      `CREATE ${unique}INDEX IF NOT EXISTS ${idx.name.trim()} ON ${table} (${idx.columns.join(', ')});`,
    );
  }

  for (const fk of state.foreignKeys) {
    if (fk.existing || !fk.name.trim() || !fk.localColumn || !fk.refTable || !fk.refColumn) continue;
    const onDelete = fk.onDelete !== 'NO ACTION' ? ` ON DELETE ${fk.onDelete}` : '';
    statements.push(
      `ALTER TABLE ${table} ADD CONSTRAINT ${fk.name.trim()} FOREIGN KEY (${fk.localColumn}) REFERENCES ${original.schema_name}.${fk.refTable} (${fk.refColumn})${onDelete};`,
    );
  }

  if (state.indexes.some((i) => i.existing === false && i.name.trim())) {
    // handled above
  }

  const removedIndexes = (original.indexes ?? []).filter(
    (orig) => !state.indexes.some((s) => s.existing && s.name === orig.name),
  );
  for (const idx of removedIndexes) {
    statements.push(`DROP INDEX IF EXISTS ${idx.name};`);
  }

  const removedFks = (original.foreign_keys ?? []).filter(
    (orig) => !state.foreignKeys.some((s) => s.existing && s.name === orig.name),
  );
  for (const fk of removedFks) {
    statements.push(`ALTER TABLE ${table} DROP CONSTRAINT ${fk.name};`);
  }

  if (statements.length === 0) {
    return '-- No changes to apply';
  }
  return statements.join('\n\n');
}

export function buildDdl(
  mode: 'create' | 'edit',
  schemaName: string,
  state: TableSchemaState,
  original?: WorkspaceDatabaseTableDetail,
): string {
  if (mode === 'create') {
    return buildCreateTableSql(schemaName, state);
  }
  if (!original) {
    return '-- Missing original table metadata';
  }
  return buildAlterTableSql(original, state);
}

export function validateSchemaState(state: TableSchemaState): string | null {
  if (!state.tableName.trim()) return 'Table name is required';
  const named = state.columns.filter((c) => c.name.trim());
  if (named.length === 0) return 'Add at least one column';
  const names = new Set<string>();
  for (const col of named) {
    if (names.has(col.name.trim())) return `Duplicate column name: ${col.name}`;
    names.add(col.name.trim());
    if (TYPE_HAS_LENGTH[col.baseType] && (!col.length || col.length < 1)) {
      return `Length is required for ${col.baseType} on column ${col.name}`;
    }
    if (col.baseType === 'NUMERIC' && (!col.precision || col.precision < 1)) {
      return `Precision is required for NUMERIC on column ${col.name}`;
    }
  }
  for (const idx of state.indexes) {
    if (!idx.name.trim() && idx.columns.length > 0) return 'Index name is required';
    if (idx.name.trim() && idx.columns.length === 0) return `Select columns for index ${idx.name}`;
  }
  for (const fk of state.foreignKeys) {
    if (!fk.name.trim() && (fk.localColumn || fk.refTable)) return 'Foreign key constraint name is required';
    if (fk.name.trim() && (!fk.localColumn || !fk.refTable || !fk.refColumn)) {
      return `Complete foreign key ${fk.name}`;
    }
  }
  return null;
}
