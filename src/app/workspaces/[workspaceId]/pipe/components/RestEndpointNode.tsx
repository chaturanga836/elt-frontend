'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, Avatar, Typography, Flex, Modal, Select, Form, Spin, Alert } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import { connectionService } from '@/services/connection.service';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspaceTenantId } from '@/lib/tenantScope';
import PipelineConnectionVariablesEditor from './PipelineConnectionVariablesEditor';
import {
  type PipelineVarRow,
  rowsFromRuntimeEffective,
  rowsFromSavedPipelineVariables,
  toPipelineVariablePayload,
} from '@/lib/pipelineConnectionVariables';

const { Text } = Typography;

type RestConnectionSummary = {
  id: number;
  name: string;
  effective_url?: string | null;
  url?: string | null;
  method?: number;
  group_name?: string | null;
};

type NodeConfig = {
  rest_connection_id?: number;
  overrides?: { variables?: Array<{ key: string; value: string; enabled?: boolean }> };
  tenant_id?: string;
  workspace_id?: number;
  label?: string;
};

export default function RestEndpointNode({ id, data }: { id: string; data: Record<string, unknown> }) {
  const workspaceId = useWorkspaceId();
  const updateNodeData = usePipelineStore((s) => s.updateNodeData);
  const nodeConfig = (data.node_config as NodeConfig) || {};
  const selectedId =
    (data.rest_connection_id as number | undefined) ??
    nodeConfig.rest_connection_id;

  const [open, setOpen] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [items, setItems] = useState<RestConnectionSummary[]>([]);
  const [varRows, setVarRows] = useState<PipelineVarRow[]>([]);
  const [baseRows, setBaseRows] = useState<PipelineVarRow[]>([]);
  const [formConnectionId, setFormConnectionId] = useState<number | undefined>(selectedId);

  const [form] = Form.useForm();

  const selected = useMemo(
    () => items.find((c) => c.id === selectedId) || null,
    [items, selectedId],
  );

  const loadConnectionList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await connectionService.getConnections(workspaceId);
      setItems(res || []);
    } finally {
      setListLoading(false);
    }
  }, [workspaceId]);

  const loadVariablesForConnection = useCallback(
    async (connectionId: number, savedOverrides?: NodeConfig['overrides']) => {
      setDetailLoading(true);
      try {
        const runtime = await connectionService.getConnectionRuntime(connectionId, workspaceId);
        const effective = runtime?.effective as Parameters<typeof rowsFromRuntimeEffective>[0];
        const fromConnection = rowsFromRuntimeEffective(effective);
        setBaseRows(fromConnection);
        const merged = rowsFromSavedPipelineVariables(
          savedOverrides?.variables,
          fromConnection,
        );
        setVarRows(merged);
      } finally {
        setDetailLoading(false);
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    if (!open) return;
    void loadConnectionList();
  }, [open, loadConnectionList]);

  const openModal = () => {
    const connId = selectedId;
    form.setFieldsValue({ rest_connection_id: connId });
    setFormConnectionId(connId);
    if (connId) {
      void loadVariablesForConnection(connId, nodeConfig.overrides);
    } else {
      setVarRows([]);
      setBaseRows([]);
    }
    setOpen(true);
  };

  const handleConnectionChange = (connectionId: number) => {
    setFormConnectionId(connectionId);
    void loadVariablesForConnection(connectionId);
  };

  const handleResetVariables = () => {
    setVarRows(baseRows.map((r) => ({ ...r, uiId: r.uiId })));
  };

  const onOk = async () => {
    const values = await form.validateFields();
    const rest_connection_id = Number(values.rest_connection_id);
    const conn = items.find((c) => c.id === rest_connection_id);

    const variables = toPipelineVariablePayload(varRows);

    updateNodeData(id, {
      label: conn?.name || 'Connection',
      node_config: {
        ...nodeConfig,
        rest_connection_id,
        overrides: {
          ...(nodeConfig.overrides || {}),
          variables,
        },
        tenant_id: workspaceTenantId(workspaceId),
        workspace_id: workspaceId,
        label: conn?.name || 'Connection',
      },
      rest_connection_id,
    });
    setOpen(false);
  };

  const enabledVarCount = varRows.filter((r) => r.enabled && r.key.trim()).length;

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
        onClick={openModal}
      >
        <Flex align="center" gap={8}>
          <Avatar size={22} shape="square" icon={<ApiOutlined />} style={{ backgroundColor: '#13c2c2' }} />
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ fontSize: 11 }} ellipsis>
              {selected?.name || 'Select connection'}
            </Text>
            <div style={{ lineHeight: 1.2 }}>
              <Text type="secondary" style={{ fontSize: 10 }} ellipsis>
                {selected
                  ? enabledVarCount > 0
                    ? `${enabledVarCount} pipeline var${enabledVarCount === 1 ? '' : 's'}`
                    : selected.effective_url || selected.url || 'Configured'
                  : '—'}
              </Text>
            </div>
          </div>
        </Flex>
      </Card>

      <Handle type="source" position={Position.Right} style={{ background: '#13c2c2' }} />

      <Modal
        title="Connection node"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onOk}
        okButtonProps={{ loading: listLoading || detailLoading }}
        width={720}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Connection"
            name="rest_connection_id"
            rules={[{ required: true, message: 'Select a connection' }]}
          >
            <Select
              loading={listLoading}
              placeholder="Select saved REST connection"
              options={items.map((c) => ({
                value: c.id,
                label: `${c.name}${c.group_name ? ` (${c.group_name})` : ''}`,
              }))}
              showSearch
              optionFilterProp="label"
              onChange={handleConnectionChange}
            />
          </Form.Item>
        </Form>

        {!formConnectionId ? (
          <Alert type="info" showIcon message="Select a connection to configure pipeline variables." />
        ) : detailLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : (
          <PipelineConnectionVariablesEditor
            rows={varRows}
            onChange={setVarRows}
            onResetToConnectionDefaults={handleResetVariables}
          />
        )}
      </Modal>
    </div>
  );
}
