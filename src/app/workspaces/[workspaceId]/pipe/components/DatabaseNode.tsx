'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, Avatar, Typography, Flex, Modal, Select, Form, Alert, Input, Radio } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import { connectionService } from '@/services/connection.service';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspaceTenantId } from '@/lib/tenantScope';
import PipelineNodeDeleteButton from './PipelineNodeDeleteButton';
import DatabaseNodeColumnMapEditor from './DatabaseNodeColumnMapEditor';
import {
  storedToUiColumnMap,
  type DbColumnMapUi,
  uiToStoredColumnMap,
} from '@/lib/dbColumnMap';
import type { StoredColumnMappings } from '@/lib/dbColumnMap';
import styles from '../pipeline-editor.module.css';

const { Text } = Typography;
const { TextArea } = Input;

type DbOperation = 'read' | 'insert' | 'update' | 'script';

type DbConnectionSummary = {
  id: number;
  name: string;
  source_type?: string;
  prototype_id?: string | null;
};

type NodeConfig = {
  connection_id?: number;
  source_type?: string;
  prototype_id?: string;
  operation?: DbOperation | 'write';
  allowed_tables?: string[];
  table?: string;
  query?: string;
  script?: string;
  input_path?: string;
  params_path?: string;
  write_mode?: string;
  key_columns?: string[] | string;
  column_map?: Record<string, string>;
  column_mappings?: StoredColumnMappings;
  tenant_id?: string;
  workspace_id?: number;
  label?: string;
};

const OPERATION_LABELS: Record<DbOperation, string> = {
  read: 'Read',
  insert: 'Insert',
  update: 'Update',
  script: 'Script',
};

function normalizeOperation(config: NodeConfig): DbOperation {
  const raw = config.operation || 'insert';
  if (raw === 'write') {
    return config.write_mode === 'update' ? 'update' : 'insert';
  }
  return raw as DbOperation;
}

function formatKeyColumns(value: string[] | string | undefined): string {
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
}

function parseKeyColumns(raw: string): string[] {
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function DatabaseNode({ id, data }: { id: string; data: Record<string, unknown> }) {
  const workspaceId = useWorkspaceId();
  const updateNodeData = usePipelineStore((s) => s.updateNodeData);
  const pipelineGlobalKeys = usePipelineStore((s) =>
    s.pipelineGlobals.variables.map((v) => v.key).filter(Boolean),
  );
  const nodeConfig = (data.node_config as NodeConfig) || {};
  const selectedId =
    (data.connection_id as number | undefined) ?? nodeConfig.connection_id;
  const savedOperation = normalizeOperation(nodeConfig);
  const savedAllowedTables = nodeConfig.allowed_tables || [];

  const [open, setOpen] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [columnsError, setColumnsError] = useState<string | null>(null);
  const [connectionTables, setConnectionTables] = useState<string[]>([]);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [columnMapUi, setColumnMapUi] = useState<DbColumnMapUi>({});
  const [items, setItems] = useState<DbConnectionSummary[]>([]);
  const [form] = Form.useForm();

  const selected = useMemo(
    () => items.find((c) => c.id === selectedId) || null,
    [items, selectedId],
  );

  const operation = (Form.useWatch('operation', form) ?? savedOperation) as DbOperation;
  const watchedConnectionId = Form.useWatch('connection_id', form);
  const watchedAllowedTables = (Form.useWatch('allowed_tables', form) as string[] | undefined) ?? [];
  const watchedTable = Form.useWatch('table', form) as string | undefined;

  const loadConnectionList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await connectionService.getUnifiedConnections(workspaceId);
      const dbOnly = (res || []).filter(
        (c: DbConnectionSummary) => c.source_type === 'db',
      );
      setItems(dbOnly);
    } finally {
      setListLoading(false);
    }
  }, [workspaceId]);

  const loadTablesForConnection = useCallback(
    async (connectionId: number | undefined) => {
      if (!connectionId) {
        setConnectionTables([]);
        setTablesError(null);
        return;
      }
      setTablesLoading(true);
      setTablesError(null);
      try {
        const res = await connectionService.getConnectionTables(connectionId, workspaceId);
        setConnectionTables(res.tables || []);
      } catch (err: unknown) {
        setConnectionTables([]);
        const message =
          err && typeof err === 'object' && 'response' in err
            ? String((err as { response?: { data?: { detail?: string } } }).response?.data?.detail)
            : 'Failed to load tables';
        setTablesError(message || 'Failed to load tables');
      } finally {
        setTablesLoading(false);
      }
    },
    [workspaceId],
  );

  const loadColumnsForTable = useCallback(
    async (
      connectionId: number | undefined,
      table: string | undefined,
      existingMappings?: StoredColumnMappings,
      legacyColumnMap?: Record<string, string>,
    ) => {
      if (!connectionId || !table) {
        setTableColumns([]);
        setColumnMapUi({});
        setColumnsError(null);
        return;
      }
      setColumnsLoading(true);
      setColumnsError(null);
      try {
        const res = await connectionService.getConnectionTableColumns(
          connectionId,
          workspaceId,
          table,
        );
        const columns = res.columns || [];
        setTableColumns(columns);
        setColumnMapUi(storedToUiColumnMap(existingMappings, legacyColumnMap, columns));
      } catch (err: unknown) {
        setTableColumns([]);
        setColumnMapUi({});
        const message =
          err && typeof err === 'object' && 'response' in err
            ? String((err as { response?: { data?: { detail?: string } } }).response?.data?.detail)
            : 'Failed to load columns';
        setColumnsError(message || 'Failed to load columns');
      } finally {
        setColumnsLoading(false);
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    void loadConnectionList();
  }, [loadConnectionList]);

  useEffect(() => {
    if (!open) return;
    void loadTablesForConnection(
      watchedConnectionId != null ? Number(watchedConnectionId) : undefined,
    );
  }, [open, watchedConnectionId, loadTablesForConnection]);

  useEffect(() => {
    if (!open) return;
    if (operation !== 'insert' && operation !== 'update') return;
    const connId = watchedConnectionId != null ? Number(watchedConnectionId) : undefined;
    if (!connId || !watchedTable) {
      setTableColumns([]);
      setColumnMapUi({});
      setColumnsError(null);
      return;
    }
    const preserveMappings =
      watchedTable === nodeConfig.table ? nodeConfig.column_mappings : undefined;
    const preserveLegacy =
      watchedTable === nodeConfig.table ? nodeConfig.column_map : undefined;
    void loadColumnsForTable(connId, watchedTable, preserveMappings, preserveLegacy);
  }, [
    open,
    operation,
    watchedConnectionId,
    watchedTable,
    loadColumnsForTable,
    nodeConfig.table,
    nodeConfig.column_mappings,
    nodeConfig.column_map,
  ]);

  const openModal = () => {
    form.setFieldsValue({
      connection_id: selectedId,
      allowed_tables: savedAllowedTables,
      operation: savedOperation,
      table: nodeConfig.table || undefined,
      query: nodeConfig.query || 'SELECT 1',
      script:
        nodeConfig.script ||
        nodeConfig.query ||
        'UPDATE my_table SET status = :status WHERE id = :id',
      input_path: nodeConfig.input_path || '',
      params_path: nodeConfig.params_path || '',
      key_columns: formatKeyColumns(nodeConfig.key_columns),
    });
    setTableColumns([]);
    setColumnMapUi({});
    setColumnsError(null);
    setOpen(true);
  };

  const onOk = async () => {
    const values = await form.validateFields();
    const connection_id = Number(values.connection_id);
    const conn = items.find((c) => c.id === connection_id);
    const allowed_tables = (values.allowed_tables as string[] | undefined) || [];
    const op = values.operation as DbOperation;

    let column_mappings: StoredColumnMappings | undefined;
    if (op === 'insert' || op === 'update') {
      column_mappings = uiToStoredColumnMap(columnMapUi);
    }

    const input_path = (values.input_path || '').trim() || undefined;
    const params_path = (values.params_path || '').trim() || undefined;

    const nextConfig: NodeConfig = {
      ...nodeConfig,
      connection_id,
      source_type: 'db',
      prototype_id: conn?.prototype_id || nodeConfig.prototype_id,
      operation: op,
      allowed_tables,
      input_path,
      params_path,
      tenant_id: workspaceTenantId(workspaceId),
      workspace_id: workspaceId,
      label: conn?.name || 'Database',
    };

    if (op === 'read') {
      nextConfig.query = values.query;
      delete nextConfig.script;
      delete nextConfig.table;
      delete nextConfig.key_columns;
      delete nextConfig.column_map;
      delete nextConfig.column_mappings;
      delete nextConfig.write_mode;
    } else if (op === 'script') {
      nextConfig.script = values.script;
      delete nextConfig.query;
      delete nextConfig.table;
      delete nextConfig.key_columns;
      delete nextConfig.column_map;
      delete nextConfig.column_mappings;
      delete nextConfig.write_mode;
    } else {
      nextConfig.table = values.table;
      if (column_mappings) {
        nextConfig.column_mappings = column_mappings;
      } else {
        delete nextConfig.column_mappings;
      }
      delete nextConfig.column_map;
      delete nextConfig.query;
      delete nextConfig.script;
      delete nextConfig.write_mode;
      if (op === 'update') {
        nextConfig.key_columns = parseKeyColumns(values.key_columns || '');
      } else {
        delete nextConfig.key_columns;
      }
    }

    updateNodeData(id, {
      label: conn?.name || 'Database',
      connection_id,
      node_config: nextConfig,
    });
    setOpen(false);
  };

  const opLabel = OPERATION_LABELS[savedOperation] || 'Insert';
  const tablesSummary =
    savedAllowedTables.length > 0
      ? `${savedAllowedTables.length} table${savedAllowedTables.length === 1 ? '' : 's'}`
      : 'no tables';
  const opDetail =
    savedOperation === 'read'
      ? 'SQL query'
      : savedOperation === 'script'
        ? 'SQL script'
        : nodeConfig.table || '—';

  const displayName =
    selected?.name ||
    nodeConfig.label ||
    (data.label as string | undefined) ||
    (selectedId ? `Connection #${selectedId}` : 'Select database');

  const tableOptions = useMemo(() => {
    const names = new Set([...connectionTables, ...watchedAllowedTables, ...savedAllowedTables]);
    return Array.from(names)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));
  }, [connectionTables, watchedAllowedTables, savedAllowedTables]);

  return (
    <div className={`database-node ${styles.pipelineNodeWrap}`}>
      <PipelineNodeDeleteButton nodeId={id} nodeLabel={displayName} />
      <Handle type="target" position={Position.Left} style={{ background: '#722ed1' }} />

      <Card
        size="small"
        hoverable
        style={{
          width: 148,
          borderRadius: 6,
          border: selected ? '1px solid #722ed1' : '1px dashed #d9d9d9',
          cursor: 'pointer',
        }}
        styles={{ body: { padding: '4px 8px' } }}
        onClick={openModal}
      >
        <Flex align="center" gap={8}>
          <Avatar
            size={20}
            shape="square"
            icon={<DatabaseOutlined />}
            style={{ backgroundColor: '#722ed1' }}
          />
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ fontSize: 11 }} ellipsis>
              {displayName}
            </Text>
            <div style={{ lineHeight: 1.2 }}>
              <Text type="secondary" style={{ fontSize: 10 }} ellipsis>
                {selected ? `${opLabel} · ${tablesSummary}` : '—'}
              </Text>
              {selected ? (
                <Text type="secondary" style={{ fontSize: 10, display: 'block' }} ellipsis>
                  {opDetail}
                </Text>
              ) : null}
            </div>
          </div>
        </Flex>
      </Card>

      <Handle type="source" position={Position.Right} style={{ background: '#722ed1' }} />

      <Modal
        title="Database connection node"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onOk}
        okButtonProps={{ loading: listLoading }}
        width={operation === 'script' ? 760 : 680}
        destroyOnHidden
      >
        {items.length === 0 && !listLoading ? (
          <Alert
            type="warning"
            showIcon
            title="No database connections"
            description="Create a DB connection under Connections (category Database), test it, then select it here."
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <Alert
          type="info"
          showIcon
          title="Allowed tables"
          description="Select which tables this node may read or write. SQL is only executed if every referenced table is in this list."
          style={{ marginBottom: 16 }}
        />

        <Alert
          type="info"
          showIcon
          title="Previous node data (optional)"
          description='Use input path for row payloads (e.g. records) and params path for SQL bind parameters (e.g. params). In SQL, reference values with {{input.field}}.'
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical">
          <Form.Item
            label="Database connection"
            name="connection_id"
            rules={[{ required: true, message: 'Select a connection' }]}
          >
            <Select
              loading={listLoading}
              placeholder="Select saved database connection"
              options={items.map((c) => ({
                value: c.id,
                label: `${c.name}${c.prototype_id ? ` (${c.prototype_id})` : ''}`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            label="Allowed tables"
            name="allowed_tables"
            rules={[
              {
                required: true,
                type: 'array',
                min: 1,
                message: 'Select at least one table',
              },
            ]}
            extra={
              tablesLoading
                ? 'Loading tables from connection…'
                : tablesError
                  ? tablesError
                  : connectionTables.length === 0 && watchedConnectionId
                    ? 'No tables found or connection could not be introspected.'
                    : undefined
            }
            validateStatus={tablesError ? 'warning' : undefined}
          >
            <Select
              mode="multiple"
              loading={tablesLoading}
              placeholder="Select tables this node can access"
              options={tableOptions}
              showSearch
              optionFilterProp="label"
              disabled={!watchedConnectionId}
            />
          </Form.Item>

          <Form.Item label="Operation" name="operation" initialValue="insert">
            <Radio.Group>
              <Radio.Button value="read">Read</Radio.Button>
              <Radio.Button value="insert">Insert</Radio.Button>
              <Radio.Button value="update">Update</Radio.Button>
              <Radio.Button value="script">Script</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Input path (optional)"
            name="input_path"
            tooltip="Dot path into previous node output for row data. Leave empty to use the full payload. Default for insert/update: records"
          >
            <Input placeholder="records or rows.0.data" />
          </Form.Item>

          {(operation === 'read' || operation === 'script') && (
            <Form.Item
              label="Params path (optional)"
              name="params_path"
              tooltip="Dot path to a dict in previous node output used as SQL bind parameters"
            >
              <Input placeholder="params or filters" />
            </Form.Item>
          )}

          {operation === 'read' && (
            <Form.Item
              label="SQL query"
              name="query"
              rules={[{ required: true, message: 'Query is required' }]}
              tooltip="Use :param_name for bind params and {{input.field}} for template values. Only allowed tables may appear in FROM/JOIN."
            >
              <TextArea
                rows={5}
                placeholder="SELECT * FROM my_table WHERE status = :status LIMIT {{input.limit}}"
              />
            </Form.Item>
          )}

          {operation === 'script' && (
            <Form.Item
              label="SQL script"
              name="script"
              rules={[{ required: true, message: 'SQL script is required' }]}
              tooltip="Flexible SQL — only allowed tables may be referenced"
            >
              <TextArea
                rows={8}
                placeholder={`UPDATE pages SET title = :title WHERE url = :url\n\n-- Or:\nSELECT id, title FROM pages WHERE id = {{input.id}}`}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </Form.Item>
          )}

          {(operation === 'insert' || operation === 'update') && (
            <>
              <Form.Item
                label="Target table"
                name="table"
                rules={[{ required: true, message: 'Table name is required' }]}
              >
                <Select
                  placeholder="Select target table"
                  options={tableOptions.filter((opt) =>
                    watchedAllowedTables.includes(opt.value),
                  )}
                  showSearch
                  optionFilterProp="label"
                  disabled={watchedAllowedTables.length === 0}
                  notFoundContent={
                    watchedAllowedTables.length === 0
                      ? 'Select allowed tables first'
                      : 'No matching table'
                  }
                />
              </Form.Item>

              {operation === 'update' && (
                <Form.Item
                  label="Key columns"
                  name="key_columns"
                  rules={[{ required: true, message: 'Key columns are required for update' }]}
                  tooltip="Comma-separated columns that identify each row to update"
                >
                  <Input placeholder="id or url, tenant_id" />
                </Form.Item>
              )}

              <Form.Item
                label="Column map"
                tooltip="Auto-generated from the target table. Map each column to a field from the previous node."
              >
                <DatabaseNodeColumnMapEditor
                  columns={tableColumns}
                  value={columnMapUi}
                  onChange={setColumnMapUi}
                  globalKeys={pipelineGlobalKeys}
                  loading={columnsLoading}
                  error={columnsError}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
