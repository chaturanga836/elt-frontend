import type { WorkspaceDatabaseTableDataResponse } from '@/services/workspaceDatabase.service';

export const TABLE_DATA_PAGE_SIZE = 50;

export type RowRecord = Record<string, unknown> & { __rowKey: string };

export type RowFormMode = 'insert' | 'edit' | 'copy';

export type PendingAction =
  | { kind: 'grid'; title: string; sql: string; danger?: boolean; confirmLabel?: string }
  | { kind: 'sql'; title: string; sql: string };

export type SqlResultState = {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount?: number;
  rowsAffected?: number;
  truncated?: boolean;
  statementType: string;
};

export type TableDataState = WorkspaceDatabaseTableDataResponse | null;
