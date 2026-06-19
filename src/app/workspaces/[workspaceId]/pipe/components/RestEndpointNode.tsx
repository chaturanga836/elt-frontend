'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useParams, usePathname } from 'next/navigation';
import { Card, Avatar, Typography, Flex, Modal, Spin, Alert } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import { useShallow } from 'zustand/react/shallow';
import { resolvePipelineEdges } from '@/lib/pipelineChain';
import {
  getImmediateUpstreamOutputFields,
  outputVariablesFromFields,
  restNodeOutputFields,
} from '@/lib/pipelineNodeVariables';
import type { GlobalBindingDef } from '@/lib/pipelineGlobals';
import { connectionService } from '@/services/connection.service';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspaceTenantId } from '@/lib/tenantScope';
import { workspacePath } from '@/lib/paths';
import RestConnectionPickerPanel from '@/features/orchestration/RestConnectionPickerPanel';
import {
  consumePipelineConnectionPick,
  type PipelineRestConnectionSummary,
} from '@/lib/pipelineConnectionPick';
import PipelineConnectionVariablesEditor from './PipelineConnectionVariablesEditor';
import { palette } from '@/constants/theme';
import PipelineNodeGlobalBindingsEditor, {
  rowsFromGlobalBindings,
  toGlobalBindingPayload,
  type GlobalBindingRow,
} from './PipelineNodeGlobalBindingsEditor';
import {
  type PipelineVarRow,
  rowsFromRuntimeEffective,
  rowsFromSavedPipelineVariables,
  toPipelineVariablePayload,
} from '@/lib/pipelineConnectionVariables';
import PipelineNodeDeleteButton from './PipelineNodeDeleteButton';
import styles from '../pipeline-editor.module.css';

const { Text } = Typography;

type RestConnectionSummary = PipelineRestConnectionSummary;

type NodeConfig = {
  rest_connection_id?: number;
  overrides?: { variables?: Array<{ key: string; value: string; enabled?: boolean }> };
  global_bindings?: GlobalBindingDef[];
  tenant_id?: string;
  workspace_id?: number;
  label?: string;
};

export default function RestEndpointNode({ id, data }: { id: string; data: Record<string, unknown> }) {
  const workspaceId = useWorkspaceId();
  const params = useParams();
  const pathname = usePathname();
  const pipelineSegment = params?.id;
  const pipelineReturnUrl =
    typeof pipelineSegment === 'string' && pipelineSegment !== 'new'
      ? workspacePath(workspaceId, `pipe/${pipelineSegment}`)
      : workspacePath(workspaceId, 'pipe/new');

  const updateNodeData = usePipelineStore((s) => s.updateNodeData);
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const nodeConfig = (data.node_config as NodeConfig) || {};
  const selectedId =
    (data.rest_connection_id as number | undefined) ??
    nodeConfig.rest_connection_id;

  const [open, setOpen] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [items, setItems] = useState<RestConnectionSummary[]>([]);
  const [varRows, setVarRows] = useState<PipelineVarRow[]>([]);
  const [globalBindingRows, setGlobalBindingRows] = useState<GlobalBindingRow[]>([]);
  const [baseRows, setBaseRows] = useState<PipelineVarRow[]>([]);
  const pipelineGlobalKeys = usePipelineStore(
    useShallow((s) => s.pipelineGlobals.variables.map((v) => v.key)),
  );
  const [formConnectionId, setFormConnectionId] = useState<number | undefined>(selectedId);

  const selected = useMemo(
    () => items.find((c) => c.id === selectedId) || null,
    [items, selectedId],
  );

  const { predecessor, fields: upstreamOutputs } = useMemo(() => {
    const resolvedEdges = resolvePipelineEdges(nodes, edges);
    return getImmediateUpstreamOutputFields(nodes, resolvedEdges, id);
  }, [nodes, edges, id]);

  const upstreamNodeLabel = useMemo(() => {
    if (!predecessor) return undefined;
    const data = (predecessor.data || {}) as Record<string, unknown>;
    const config = (data.node_config as Record<string, unknown>) || {};
    return (
      (data.label as string) ||
      (config.label as string) ||
      ((data.config as { name?: string } | null)?.name ?? '') ||
      predecessor.type ||
      'Previous node'
    );
  }, [predecessor]);

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
    void loadConnectionList();
  }, [loadConnectionList]);

  useEffect(() => {
    const picked = consumePipelineConnectionPick(id);
    if (!picked) return;

    setItems((prev) => {
      if (prev.some((c) => c.id === picked.id)) return prev;
      return [picked, ...prev];
    });
    setFormConnectionId(picked.id);
    void loadVariablesForConnection(picked.id, nodeConfig.overrides);
    setOpen(true);
  }, [id, pathname, loadVariablesForConnection, nodeConfig.overrides]);

  const openModal = () => {
    const connId = selectedId;
    setFormConnectionId(connId);
    setGlobalBindingRows(rowsFromGlobalBindings(nodeConfig.global_bindings));
    if (connId) {
      void loadVariablesForConnection(connId, nodeConfig.overrides);
    } else {
      setVarRows([]);
      setBaseRows([]);
    }
    void loadConnectionList();
    setOpen(true);
  };

  const handlePickerSelect = (connection: RestConnectionSummary) => {
    setFormConnectionId(connection.id);
    void loadVariablesForConnection(connection.id);
  };

  const handleResetVariables = () => {
    setVarRows(baseRows.map((r) => ({ ...r, uiId: r.uiId })));
  };

  const onOk = () => {
    const rest_connection_id = formConnectionId;
    if (!rest_connection_id) return;

    const conn =
      items.find((c) => c.id === rest_connection_id) ||
      ({ id: rest_connection_id, name: `Connection #${rest_connection_id}` } as RestConnectionSummary);

    const variables = toPipelineVariablePayload(varRows);
    const global_bindings = toGlobalBindingPayload(globalBindingRows);

    updateNodeData(id, {
      label: conn?.name || 'Connection',
      node_config: {
        ...nodeConfig,
        rest_connection_id,
        global_bindings,
        overrides: {
          ...(nodeConfig.overrides || {}),
          variables,
        },
        output_variables: outputVariablesFromFields(restNodeOutputFields()),
        tenant_id: workspaceTenantId(workspaceId),
        workspace_id: workspaceId,
        label: conn?.name || 'Connection',
      },
      rest_connection_id,
    });
    setOpen(false);
  };

  const enabledVarCount = varRows.filter((r) => r.enabled && r.key.trim()).length;
  const displayName =
    selected?.name ||
    nodeConfig.label ||
    (data.label as string | undefined) ||
    (selectedId ? `Connection #${selectedId}` : 'Select connection');

  return (
    <div className={`rest-endpoint-node ${styles.pipelineNodeWrap}`}>
      <PipelineNodeDeleteButton nodeId={id} nodeLabel={displayName} />
      <Handle type="target" position={Position.Left} style={{ background: palette.accentCyan }} />

      <Card
        size="small"
        hoverable
        style={{
          width: 148,
          borderRadius: 6,
          border: selected ? `1px solid ${palette.accentCyan}` : `1px dashed ${palette.textMuted}`,
          cursor: 'pointer',
        }}
        styles={{ body: { padding: '4px 8px' } }}
        onClick={openModal}
      >
        <Flex align="center" gap={8}>
          <Avatar size={20} shape="square" icon={<ApiOutlined />} style={{ backgroundColor: palette.accentCyan }} />
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ fontSize: 11 }} ellipsis>
              {displayName}
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

      <Handle type="source" position={Position.Right} style={{ background: palette.accentCyan }} />

      <Modal
        title="Connection node"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onOk}
        okButtonProps={{ loading: listLoading || detailLoading, disabled: !formConnectionId }}
        width={720}
        destroyOnHidden
      >
        <RestConnectionPickerPanel
          selectedId={formConnectionId ?? selectedId}
          onSelect={handlePickerSelect}
          pipelineNodeId={id}
          pipelineReturnUrl={pipelineReturnUrl}
          onNavigateAway={() => setOpen(false)}
        />

        {!formConnectionId ? (
          <Alert
            type="info"
            showIcon
            title="Select or create a connection to configure pipeline variables."
            style={{ marginTop: 16 }}
          />
        ) : detailLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <PipelineConnectionVariablesEditor
              rows={varRows}
              onChange={setVarRows}
              onResetToConnectionDefaults={handleResetVariables}
              upstreamOutputs={upstreamOutputs}
              upstreamNodeLabel={upstreamNodeLabel}
            />
            <div style={{ marginTop: 20 }}>
              <PipelineNodeGlobalBindingsEditor
                rows={globalBindingRows}
                onChange={setGlobalBindingRows}
                globalKeys={pipelineGlobalKeys}
                upstreamFields={restNodeOutputFields()}
                title="Capture connection response into globals"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
