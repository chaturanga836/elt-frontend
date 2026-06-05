'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, Avatar, Typography, Flex, Modal, Select, Form, Alert, Input, Radio } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import { connectionService } from '@/services/connection.service';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspaceTenantId } from '@/lib/tenantScope';

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
  table?: string;
  query?: string;
  script?: string;
  input_path?: string;
  params_path?: string;
  write_mode?: string;
  key_columns?: string[] | string;
  column_map?: Record<string, string>;
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
  const nodeConfig = (data.node_config as NodeConfig) || {};
  const selectedId =
    (data.connection_id as number | undefined) ?? nodeConfig.connection_id;
  const savedOperation = normalizeOperation(nodeConfig);

  const [open, setOpen] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [items, setItems] = useState<DbConnectionSummary[]>([]);
  const [form] = Form.useForm();

  const selected = useMemo(
    () => items.find((c) => c.id === selectedId) || null,
    [items, selectedId],
  );

  const operation = (Form.useWatch('operation', form) ?? savedOperation) as DbOperation;

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

  useEffect(() => {
    void loadConnectionList();
  }, [loadConnectionList]);

  const openModal = () => {
    form.setFieldsValue({
      connection_id: selectedId,
      operation: savedOperation,
      table: nodeConfig.table || '',
      query: nodeConfig.query || 'SELECT 1',
      script:
        nodeConfig.script ||
        nodeConfig.query ||
        'UPDATE my_table SET status = :status WHERE id = :id',
      input_path: nodeConfig.input_path || '',
      params_path: nodeConfig.params_path || '',
      key_columns: formatKeyColumns(nodeConfig.key_columns),
      column_map_json: nodeConfig.column_map
        ? JSON.stringify(nodeConfig.column_map, null, 2)
        : '',
    });
    setOpen(true);
  };

  const onOk = async () => {
    const values = await form.validateFields();
    const connection_id = Number(values.connection_id);
    const conn = items.find((c) => c.id === connection_id);

    let column_map: Record<string, string> | undefined;
    const rawMap = (values.column_map_json || '').trim();
    if (rawMap) {
      try {
        column_map = JSON.parse(rawMap) as Record<string, string>;
      } catch {
        throw new Error('Column map must be valid JSON');
      }
    }

    const op = values.operation as DbOperation;
    const input_path = (values.input_path || '').trim() || undefined;
    const params_path = (values.params_path || '').trim() || undefined;

    const nextConfig: NodeConfig = {
      ...nodeConfig,
      connection_id,
      source_type: 'db',
      prototype_id: conn?.prototype_id || nodeConfig.prototype_id,
      operation: op,
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
      delete nextConfig.write_mode;
    } else if (op === 'script') {
      nextConfig.script = values.script;
      delete nextConfig.query;
      delete nextConfig.table;
      delete nextConfig.key_columns;
      delete nextConfig.column_map;
      delete nextConfig.write_mode;
    } else {
      nextConfig.table = values.table;
      if (column_map) {
        nextConfig.column_map = column_map;
      } else {
        delete nextConfig.column_map;
      }
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

  return (
    <div className="database-node">
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
                {selected ? `${opLabel} → ${opDetail}` : '—'}
              </Text>
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
              tooltip="Use :param_name for bind params and {{input.field}} for template values"
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
              tooltip="Flexible SQL — SELECT returns rows; INSERT/UPDATE/DELETE returns affected row count"
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
                <Input placeholder="e.g. scraped_pages" />
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
                label="Column map (optional JSON)"
                name="column_map_json"
                tooltip='Rename fields from previous node, e.g. {"url": "page_url", "title": "page_title"}'
              >
                <TextArea rows={3} placeholder='{"url": "page_url"}' />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
