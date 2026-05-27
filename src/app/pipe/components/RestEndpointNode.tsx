'use client';

import { useEffect, useMemo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, Avatar, Typography, Flex, Modal, Select, Form, Input } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import { connectionService } from '@/services/connection.service';

const { Text } = Typography;

type RestConnectionSummary = {
  id: number;
  name: string;
  effective_url?: string | null;
  url?: string | null;
  method?: number;
  group_name?: string | null;
};

const DEFAULT_TENANT = 'trial_user_001';

export default function RestEndpointNode({ id, data }: { id: string; data: Record<string, unknown> }) {
  const updateNodeData = usePipelineStore((s) => s.updateNodeData);
  const selectedId = (data.rest_connection_id as number | undefined) ?? undefined;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RestConnectionSummary[]>([]);

  const [form] = Form.useForm();

  const selected = useMemo(
    () => items.find((c) => c.id === selectedId) || null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await connectionService.getConnections(DEFAULT_TENANT);
        if (!mounted) return;
        setItems(res || []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open]);

  const onOk = async () => {
    const values = await form.validateFields();
    const rest_connection_id = Number(values.rest_connection_id);
    const addressPath = String(values.addressPath || '').trim();
    const apiKeyPath = String(values.apiKeyPath || '').trim();

    // Build overrides using {{input.<path>}} templates (backend resolves)
    const overrides: any = {};
    const params: Array<{ key: string; value: string; enabled: boolean }> = [];
    if (addressPath) params.push({ key: 'address', value: `{{input.${addressPath}}}`, enabled: true });
    if (apiKeyPath) params.push({ key: 'apikey', value: `{{input.${apiKeyPath}}}`, enabled: true });
    if (params.length) overrides.params = params;

    updateNodeData(id, {
      label: 'REST Endpoint',
      node_config: {
        ...(data.node_config as any),
        rest_connection_id,
        overrides,
        tenant_id: DEFAULT_TENANT,
        label: selected?.name || 'REST Endpoint',
      },
      rest_connection_id,
    });
    setOpen(false);
  };

  return (
    <div className="rest-endpoint-node">
      <Handle type="target" position={Position.Left} style={{ background: '#13c2c2' }} />

      <Card
        size="small"
        hoverable
        style={{
          width: 220,
          borderRadius: 6,
          border: selected ? '1px solid #13c2c2' : '1px dashed #d9d9d9',
          cursor: 'pointer',
        }}
        styles={{ body: { padding: '8px' } }}
        onClick={() => {
          form.setFieldsValue({
            rest_connection_id: selectedId,
            addressPath: (data?.node_config as any)?.overrides?.addressPath,
            apiKeyPath: (data?.node_config as any)?.overrides?.apiKeyPath,
          });
          setOpen(true);
        }}
      >
        <Flex align="center" gap={8}>
          <Avatar size={22} shape="square" icon={<ApiOutlined />} style={{ backgroundColor: '#13c2c2' }} />
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ fontSize: 11 }} ellipsis>
              {selected?.name || 'Select REST Endpoint'}
            </Text>
            <div style={{ lineHeight: 1.2 }}>
              <Text type="secondary" style={{ fontSize: 10 }} ellipsis>
                {selected?.effective_url || selected?.url || '—'}
              </Text>
            </div>
          </div>
        </Flex>
      </Card>

      <Handle type="source" position={Position.Right} style={{ background: '#13c2c2' }} />

      <Modal
        title="REST API node"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onOk}
        okButtonProps={{ loading }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Saved endpoint"
            name="rest_connection_id"
            rules={[{ required: true, message: 'Select a REST endpoint' }]}
          >
            <Select
              loading={loading}
              placeholder="Pick a saved REST API connection"
              options={items.map((c) => ({
                value: c.id,
                label: `${c.name}${c.group_name ? ` (${c.group_name})` : ''}`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Optional: map values from previous node output into params using <Text code>{'{{input.<path>}}'}</Text>.
          </Text>

          <Form.Item label="address param path (example: output.data.result.0.address)" name="addressPath">
            <Input placeholder="output.data..." />
          </Form.Item>

          <Form.Item label="apikey param path" name="apiKeyPath">
            <Input placeholder="output.data..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

