import api from './api';

export type WorkspaceDatabaseEngine = 'postgres' | 'mysql';

export type WorkspaceDatabaseEngineInfo = {
  key: WorkspaceDatabaseEngine;
  label: string;
  available: boolean;
};

export type WorkspaceDatabaseCatalog = {
  engines: WorkspaceDatabaseEngineInfo[];
};

export type WorkspaceDatabaseItem = {
  id: number;
  name: string;
  engine: WorkspaceDatabaseEngine;
  status: string;
  provisioned_at?: string;
  instance_ref?: string;
  container_created?: boolean;
};

export type WorkspaceDatabaseListResponse = {
  databases: WorkspaceDatabaseItem[];
  has_databases: boolean;
};

export type WorkspaceDatabaseStatus = {
  provisioned: boolean;
  engine?: WorkspaceDatabaseEngine;
  name?: string;
  provisioned_at?: string;
  databases?: WorkspaceDatabaseItem[];
};

export type WorkspaceDatabaseCreateBody = {
  engine: WorkspaceDatabaseEngine;
  name: string;
};

export type WorkspaceDatabaseTableSummary = {
  name: string;
};

export type WorkspaceDatabaseTableListResponse = {
  database_id: number;
  schema_name: string;
  tables: WorkspaceDatabaseTableSummary[];
};

export type WorkspaceDatabaseTableColumn = {
  name: string;
  type: string;
  nullable: boolean;
  default?: string | null;
  primary_key: boolean;
};

export type WorkspaceDatabaseTableIndex = {
  name: string;
  columns: string[];
  unique: boolean;
};

export type WorkspaceDatabaseTableForeignKey = {
  name: string;
  constrained_columns: string[];
  referred_schema: string;
  referred_table: string;
  referred_columns: string[];
  on_delete?: string | null;
};

export type WorkspaceDatabaseTableDetail = {
  database_id: number;
  schema_name: string;
  table_name: string;
  columns: WorkspaceDatabaseTableColumn[];
  indexes?: WorkspaceDatabaseTableIndex[];
  foreign_keys?: WorkspaceDatabaseTableForeignKey[];
};

export type WorkspaceDatabaseTableDataResponse = {
  database_id: number;
  schema_name: string;
  table_name: string;
  columns: string[];
  rows: Record<string, unknown>[];
  total: number;
  limit: number;
  offset: number;
};

export type WorkspaceDatabaseDdlResponse = {
  ok: boolean;
  statements_executed: number;
};

export type WorkspaceDatabaseSqlResponse = {
  ok: boolean;
  statement_type: 'select' | 'insert' | 'update' | 'delete';
  rows_affected?: number;
  columns?: string[];
  rows?: Record<string, unknown>[];
  row_count?: number;
  truncated?: boolean;
};

export const WorkspaceDatabaseService = {
  async getCatalog(): Promise<WorkspaceDatabaseCatalog> {
    const res = await api.get<WorkspaceDatabaseCatalog>('/workspaces/catalog/workspace-databases');
    return res.data;
  },

  async list(workspaceId: number): Promise<WorkspaceDatabaseListResponse> {
    const res = await api.get<WorkspaceDatabaseListResponse>(`/workspaces/${workspaceId}/databases`);
    return res.data;
  },

  async getStatus(workspaceId: number): Promise<WorkspaceDatabaseStatus> {
    const res = await api.get<WorkspaceDatabaseStatus>(`/workspaces/${workspaceId}/database`);
    return res.data;
  },

  async create(
    workspaceId: number,
    body: WorkspaceDatabaseCreateBody,
  ): Promise<WorkspaceDatabaseStatus> {
    const res = await api.post<WorkspaceDatabaseStatus>(
      `/workspaces/${workspaceId}/databases`,
      body,
    );
    return res.data;
  },

  async listTables(
    workspaceId: number,
    databaseId: number,
  ): Promise<WorkspaceDatabaseTableListResponse> {
    const res = await api.get<WorkspaceDatabaseTableListResponse>(
      `/workspaces/${workspaceId}/databases/${databaseId}/tables`,
    );
    return res.data;
  },

  async getTableDetail(
    workspaceId: number,
    databaseId: number,
    tableName: string,
  ): Promise<WorkspaceDatabaseTableDetail> {
    const res = await api.get<WorkspaceDatabaseTableDetail>(
      `/workspaces/${workspaceId}/databases/${databaseId}/tables/${encodeURIComponent(tableName)}`,
    );
    return res.data;
  },

  async getTableData(
    workspaceId: number,
    databaseId: number,
    tableName: string,
    params?: { limit?: number; offset?: number },
  ): Promise<WorkspaceDatabaseTableDataResponse> {
    const res = await api.get<WorkspaceDatabaseTableDataResponse>(
      `/workspaces/${workspaceId}/databases/${databaseId}/tables/${encodeURIComponent(tableName)}/data`,
      { params },
    );
    return res.data;
  },

  async executeDdl(
    workspaceId: number,
    databaseId: number,
    sql: string,
  ): Promise<WorkspaceDatabaseDdlResponse> {
    const res = await api.post<WorkspaceDatabaseDdlResponse>(
      `/workspaces/${workspaceId}/databases/${databaseId}/ddl`,
      { sql },
    );
    return res.data;
  },

  async executeSql(
    workspaceId: number,
    databaseId: number,
    sql: string,
  ): Promise<WorkspaceDatabaseSqlResponse> {
    const res = await api.post<WorkspaceDatabaseSqlResponse>(
      `/workspaces/${workspaceId}/databases/${databaseId}/sql`,
      { sql },
    );
    return res.data;
  },
};
