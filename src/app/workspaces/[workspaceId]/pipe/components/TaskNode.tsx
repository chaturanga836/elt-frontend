'use client';

import { useEffect, useMemo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useParams, usePathname, useRouter, useSelectedLayoutSegment } from 'next/navigation';
import { Card, Avatar, Typography, Flex, Button, Modal } from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  NodeIndexOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import { useShallow } from 'zustand/react/shallow';
import { resolvePipelineEdges } from '@/lib/pipelineChain';
import {
  buildDefaultTaskNodeVariables,
  getImmediateUpstreamOutputFields,
  mergeTaskOutputVariables,
  type PipelineInputVariableDef,
  type PipelineVariableDef,
} from '@/lib/pipelineNodeVariables';
import { TaskResponse, TaskService } from '@/services/task.service';
import TaskPickerModal from '@/features/orchestration/TaskPickerModal';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';
import { consumePipelineTaskPick } from '@/lib/pipelineTaskPick';
import { palette } from '@/constants/theme';
import PipelineScriptVariablesEditor, {
  rowsFromInputVariables,
  rowsFromTaskOutputVariables,
  toInputVariablePayload,
  toTaskOutputVariablePayload,
  type InputVarRow,
  type OutputVarRow,
} from './PipelineScriptVariablesEditor';
import PipelineNodeGlobalBindingsEditor, {
  rowsFromGlobalBindings,
  toGlobalBindingPayload,
  type GlobalBindingRow,
} from './PipelineNodeGlobalBindingsEditor';
import type { GlobalBindingDef } from '@/lib/pipelineGlobals';
import PipelineNodeDeleteButton from './PipelineNodeDeleteButton';
import styles from '../pipeline-editor.module.css';

const { Text } = Typography;

type TaskNodeConfig = {
  input_variables?: PipelineInputVariableDef[];
  output_variables?: PipelineVariableDef[];
  global_bindings?: GlobalBindingDef[];
};

const TaskNode = ({ id, data }: { id: string; data: Record<string, unknown> }) => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const modalSegment = useSelectedLayoutSegment('modal');
  const pipelineSegment = params?.id;
  const pipelineReturnUrl =
    typeof pipelineSegment === 'string' && pipelineSegment !== 'new'
      ? workspacePath(workspaceId, `pipe/${pipelineSegment}`)
      : workspacePath(workspaceId, 'pipe/new');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [variablesOpen, setVariablesOpen] = useState(false);
  const [inputRows, setInputRows] = useState<InputVarRow[]>([]);
  const [outputRows, setOutputRows] = useState<OutputVarRow[]>([]);
  const [globalBindingRows, setGlobalBindingRows] = useState<GlobalBindingRow[]>([]);
  const updateNodeData = usePipelineStore((state) => state.updateNodeData);
  const nodes = usePipelineStore((state) => state.nodes);
  const edges = usePipelineStore((state) => state.edges);
  const pipelineGlobalKeys = usePipelineStore(
    useShallow((s) => s.pipelineGlobals.variables.map((v) => v.key)),
  );
  const nodeConfig = (data.node_config as TaskNodeConfig) || {};
  const allOutputVars = mergeTaskOutputVariables(nodeConfig.output_variables);
  const outputVarCount = allOutputVars.length;
  const customOutputCount = allOutputVars.filter((v) => v.key !== 'result').length;
  const inputVarCount =
    nodeConfig.input_variables?.filter((v) => v.enabled !== false && v.key?.trim()).length ?? 0;
  const selected = (data.config as TaskResponse | null) || null;
  const nodeLabel =
    selected?.name ||
    (typeof data.label === 'string' ? data.label : undefined) ||
    'Script node';

  const { predecessor, fields: upstreamOutputs } = useMemo(() => {
    const resolvedEdges = resolvePipelineEdges(nodes, edges);
    return getImmediateUpstreamOutputFields(nodes, resolvedEdges, id);
  }, [nodes, edges, id]);

  const upstreamNodeLabel = useMemo(() => {
    if (!predecessor) return undefined;
    const predData = (predecessor.data || {}) as Record<string, unknown>;
    const predConfig = (predData.node_config as Record<string, unknown>) || {};
    return (
      (predData.label as string) ||
      (predConfig.label as string) ||
      ((predData.config as { name?: string } | null)?.name ?? '') ||
      predecessor.type ||
      'Previous node'
    );
  }, [predecessor]);

  useEffect(() => {
    const task = consumePipelineTaskPick(id);
    if (task) {
      updateNodeData(id, { config: task, task_id: task.id });
    }
  }, [id, pathname, modalSegment, updateNodeData]);

  useEffect(() => {
    const taskId = data.task_id as number | undefined;
    if (!taskId || data.config) return;

    let cancelled = false;
    void TaskService.getTask(workspaceId, taskId)
      .then((task) => {
        if (!cancelled) {
          updateNodeData(id, { config: task, task_id: task.id });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [id, data.task_id, data.config, updateNodeData]);

  const seedVariablesIfEmpty = (existing: TaskNodeConfig) => {
    if (existing.input_variables?.length || existing.output_variables?.length) {
      return existing;
    }
    if (!upstreamOutputs.length) return existing;
    return {
      ...existing,
      ...buildDefaultTaskNodeVariables(upstreamOutputs),
    };
  };

  const onSelect = (item: TaskResponse) => {
    const nextConfig = seedVariablesIfEmpty(nodeConfig);
    updateNodeData(id, {
      config: item,
      task_id: item.id,
      node_config: nextConfig,
    });
    setPickerOpen(false);
  };

  const openScriptPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPickerOpen(true);
  };

  const openScriptEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selected?.id) return;
    const query = new URLSearchParams({
      from: 'pipeline',
      nodeId: id,
      returnUrl: pipelineReturnUrl,
    });
    router.push(`${workspacePath(workspaceId, `task/${selected.id}`)}?${query.toString()}`);
  };

  const openVariablesModal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setInputRows(rowsFromInputVariables(nodeConfig.input_variables, upstreamOutputs));
    setOutputRows(rowsFromTaskOutputVariables(nodeConfig.output_variables));
    setGlobalBindingRows(rowsFromGlobalBindings(nodeConfig.global_bindings));
    setVariablesOpen(true);
  };

  const saveVariables = () => {
    const input_variables = toInputVariablePayload(inputRows);
    const output_variables = toTaskOutputVariablePayload(outputRows, pipelineGlobalKeys);
    const global_bindings = toGlobalBindingPayload(globalBindingRows);
    const latestNode = usePipelineStore.getState().nodes.find((node) => node.id === id);
    const latestConfig = ((latestNode?.data as Record<string, unknown> | undefined)?.node_config ||
      {}) as TaskNodeConfig;
    updateNodeData(id, {
      node_config: {
        ...latestConfig,
        input_variables,
        output_variables,
        global_bindings,
      },
    });
    setVariablesOpen(false);
  };

  const handleCardClick = () => {
    if (!selected) {
      setPickerOpen(true);
      return;
    }
    openVariablesModal();
  };

  return (
    <div className={`custom-node ${styles.pipelineNodeWrap}`}>
      <PipelineNodeDeleteButton nodeId={id} nodeLabel={nodeLabel} />
      <Handle type="target" position={Position.Left} style={{ background: palette.primary }} />

      <Card
        size="small"
        hoverable
        style={{
          width: 148,
          minHeight: 45,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          border: selected ? `1px solid ${palette.primary}` : `1px dashed ${palette.textMuted}`,
          cursor: 'pointer',
        }}
        styles={{ body: { padding: '4px 8px', width: '100%' } }}
        onClick={handleCardClick}
      >
        {!selected ? (
          <Flex align="center" gap={4} justify="center" style={{ width: '100%' }}>
            <PlusOutlined style={{ fontSize: 10, color: palette.textMuted }} />
            <Text style={{ fontSize: 10, color: palette.textMuted }}>Select script</Text>
          </Flex>
        ) : (
          <Flex align="center" gap={4} style={{ width: '100%' }}>
            <Avatar
              size={20}
              shape="square"
              icon={<SettingOutlined />}
              style={{ backgroundColor: palette.primary, flexShrink: 0 }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text strong style={{ fontSize: 10, display: 'block' }} ellipsis>
                {selected.name}
              </Text>
              <Text type="secondary" style={{ fontSize: 9, lineHeight: 1.2 }} ellipsis>
                {inputVarCount > 0
                  ? `${inputVarCount} in · ${outputVarCount} out`
                  : customOutputCount > 0
                    ? `result + ${customOutputCount} out`
                    : `${outputVarCount} output${outputVarCount === 1 ? '' : 's'}`}
              </Text>
            </div>
            <Button
              type="text"
              size="small"
              icon={<SwapOutlined style={{ fontSize: 11 }} />}
              onClick={openScriptPicker}
              title="Change script"
              style={{ flexShrink: 0, width: 20, height: 20, minWidth: 20, padding: 0 }}
            />
            <Button
              type="text"
              size="small"
              icon={<NodeIndexOutlined style={{ fontSize: 11 }} />}
              onClick={openVariablesModal}
              title="Input / output variables"
              style={{ flexShrink: 0, width: 20, height: 20, minWidth: 20, padding: 0 }}
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: 11 }} />}
              onClick={openScriptEditor}
              title="Edit script code"
              style={{ flexShrink: 0, width: 20, height: 20, minWidth: 20, padding: 0 }}
            />
          </Flex>
        )}
      </Card>

      <Handle type="source" position={Position.Right} style={{ background: palette.primary }} />

      <TaskPickerModal
        title={selected ? 'Change script' : 'Select script'}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedId={selected?.id}
        onSelect={onSelect}
        pipelineNodeId={id}
        pipelineReturnUrl={pipelineReturnUrl}
      />

      <Modal
        title="Script variables"
        open={variablesOpen}
        onCancel={() => setVariablesOpen(false)}
        onOk={saveVariables}
        okText="Save"
        width={640}
        destroyOnHidden
      >
        <PipelineScriptVariablesEditor
          inputRows={inputRows}
          onInputChange={setInputRows}
          outputRows={outputRows}
          onOutputChange={setOutputRows}
          upstreamNodeLabel={upstreamNodeLabel}
          upstreamOutputs={upstreamOutputs}
          globalKeys={pipelineGlobalKeys}
        />
        <div style={{ marginTop: 20 }}>
          <PipelineNodeGlobalBindingsEditor
            rows={globalBindingRows}
            onChange={setGlobalBindingRows}
            globalKeys={pipelineGlobalKeys}
            upstreamFields={mergeTaskOutputVariables(toTaskOutputVariablePayload(outputRows)).map(
              (v) => ({
                path: v.key,
                label: v.key,
                description: v.description,
              }),
            )}
            title="Export script return fields to globals"
          />
        </div>
      </Modal>
    </div>
  );
};

export default TaskNode;
