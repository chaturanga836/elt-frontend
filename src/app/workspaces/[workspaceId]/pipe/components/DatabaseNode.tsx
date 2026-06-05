'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, Avatar, Typography, Flex, Modal, Select, Form, Spin, Alert, Input, Radio } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import { connectionService } from '@/services/connection.service';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspaceTenantId } from '@/lib/tenantScope';

const { Text } = Typography;
const { TextArea } = Input;

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
  operation?: 'read' | 'write';
  table?: string;
  query?: string;
  input_path?: string;
  write_mode?: string;
  column_map?: Record<string, string>;
  tenant_id?: string;
  workspace_id?: number;
  label?: string;
};

export default function DatabaseNode({ id, data }: { id: string; data: Record<string, unknown> }) {
  const workspaceId = useWorkspaceId();
  const updateNodeData = usePipelineStore((s) => s.updateNodeData);
  const nodeConfig = (data.node_config as NodeConfig) || {};
  const selectedId =
    (data.connection_id as number | undefined) ?? nodeConfig.connection_id;

  const [open, setOpen] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [items, setItems] = useState<DbConnectionSummary[]>([]);
  const [form] = Form.useForm();

  const selected = useMemo(
    () => items.find((c) => c.id === selectedId) || null,
    [items, selectedId],
  );

  const operation = Form.useWatch('operation', form) ?? nodeConfig.operation ?? 'write';

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
    if (!open) return;
    void loadConnectionList();
  }, [open, loadConnectionList]);

  const openModal = () => {
    form.setFieldsValue({
      connection_id: selectedId,
      operation: nodeConfig.operation || 'write',
      table: nodeConfig.table || '',
      query: nodeConfig.query || 'SELECT 1',
      input_path: nodeConfig.input_path || 'records',
      write_mode: nodeConfig.write_mode || 'insert',
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

    const op = values.operation as 'read' | 'write';
    updateNodeData(id, {
      label: conn?.name || 'Database',
      connection_id,
      node_config: {
        ...nodeConfig,
        connection_id,
        source_type: 'db',
        prototype_id: conn?.prototype_id || nodeConfig.prototype_id,
        operation: op,
        table: op === 'write' ? values.table : undefined,
        query: op === 'read' ? values.query : undefined,
        input_path: op === 'write' ? values.input_path || 'records' : undefined,
        write_mode: op === 'write' ? values.write_mode || 'insert' : undefined,
        ...(column_map ? { column_map } : {}),
        tenant_id: workspaceTenantId(workspaceId),
        workspace_id: workspaceId,
        label: conn?.name || 'Database',
      },
    });
    setOpen(false);
  };

  const opLabel = nodeConfig.operation === 'read' ? 'Read' : 'Write';

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
              {selected?.name || 'Select database'}
            </Text>
            <div style={{ lineHeight: 1.2 }}>
              <Text type="secondary" style={{ fontSize: 10 }} ellipsis>
                {selected
                  ? `${opLabel}${nodeConfig.table ? ` → ${nodeConfig.table}` : ''}`
                  : '—'}
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
        width={640}
        destroyOnHidden
      >
        {items.length === 0 && !listLoading ? (
          <Alert
            type="warning"
            showIcon
            message="No database connections"
            description="Create a DB connection under Connections (category Database), test it, then select it here."
            style={{ marginBottom: 16 }}
          />
        ) : null}

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

          <Form.Item label="Operation" name="operation" initialValue="write">
            <Radio.Group>
              <Radio.Button value="write">Write (push rows)</Radio.Button>
              <Radio.Button value="read">Read (SQL query)</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {operation === 'write' ? (
            <>
              <Form.Item
                label="Target table"
                name="table"
                rules={[{ required: true, message: 'Table name is required' }]}
              >
                <Input placeholder="e.g. scraped_pages" />
              </Form.Item>
              <Form.Item
                label="Input path"
                name="input_path"
                tooltip="Dot path into previous node output (default: records)"
              >
                <Input placeholder="records" />
              </Form.Item>
              <Form.Item label="Write mode" name="write_mode">
                <Select
                  options={[{ value: 'insert', label: 'Insert rows' }]}
                />
              </Form.Item>
              <Form.Item
                label="Column map (optional JSON)"
                name="column_map_json"
                tooltip='Rename fields, e.g. {"url": "page_url", "title": "page_title"}'
              >
                <TextArea rows={3} placeholder='{"url": "page_url"}' />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              label="SQL query"
              name="query"
              rules={[{ required: true, message: 'Query is required' }]}
              tooltip="Use {{input.field}} for values from the previous node"
            >
              <TextArea rows={4} placeholder="SELECT * FROM my_table LIMIT 10" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
