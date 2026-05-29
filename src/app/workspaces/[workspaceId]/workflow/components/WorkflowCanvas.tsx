'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Button, Input, Space } from 'antd';
import {
  SaveOutlined,
  PlayCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import WorkflowCanvasInner from './WorkflowCanvasInner';
import WorkflowNodePalette from './WorkflowNodePalette';
import { WorkflowService } from '@/services/workflow.service';
import { notification } from '@/lib/antd/static';
import {
  WorkflowCreatePayload,
  WorkflowNodeTypeInt,
} from '@/types/workflow';
import { buildBoundaryNodeConfig } from '@/types/boundaryHooks';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

function mapNodeType(type?: string): WorkflowNodeTypeInt {
  const map: Record<string, WorkflowNodeTypeInt> = {
    startNode: 0,
    taskNode: 1,
    endNode: 2,
    pipelineNode: 3,
    conditionNode: 4,
    parallelForkNode: 5,
    parallelJoinNode: 6,
  };
  return map[type || ''] ?? 1;
}

function WorkflowCanvasContent() {
  const workspaceId = useWorkspaceId();
  const params = useParams();
  const { getViewport } = useReactFlow();
  const {
    nodes,
    edges,
    name,
    description,
    setName,
    setDescription,
    getId,
    setId,
    setUuid,
  } = useWorkflowStore();
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [workflowUuid, setWorkflowUuid] = useState<string | null>(
    (params?.id as string) || null,
  );

  const buildPayload = (): WorkflowCreatePayload => {
    const uuid = workflowUuid || uuidv4();
    return {
      ...(getId() ? { id: getId()! } : {}),
      workflow_uuid: uuid,
      name,
      description,
      org_id: 1,
      workspace_id: workspaceId,
      canvas_structure: {
        nodes,
        edges,
        viewport: getViewport(),
      },
      nodes: nodes.map((node) => {
        const nodeType = mapNodeType(node.type);
        const isBoundary = nodeType === 0 || nodeType === 2;
        const nodeConfig = buildBoundaryNodeConfig(
          node.data as Record<string, unknown>,
          nodeType === 2,
        );
        return {
          node_uuid: node.id,
          node_type: nodeType,
          task_id: isBoundary
            ? (nodeConfig.hook_task_id ?? null)
            : ((node.data?.task_id as number) || null),
          node_config: nodeConfig,
        };
      }),
    };
  };

  const handleSave = async () => {
    if (!name.trim()) {
      notification.warning({ message: 'Workflow name is required' });
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      const id = getId();
      if (id) {
        await WorkflowService.updateWorkflow(id, payload);
      } else {
        const res = await WorkflowService.saveWorkflow(payload);
        setId(res.workflow_id);
      }
      setWorkflowUuid(payload.workflow_uuid);
      setUuid(payload.workflow_uuid);
      notification.success({ message: 'Workflow saved' });
    } catch (e) {
      notification.error({ message: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    const uuid = workflowUuid || useWorkflowStore.getState().uuid;
    if (!uuid) {
      notification.warning({ message: 'Save workflow before running' });
      return;
    }
    setRunning(true);
    try {
      const res = await WorkflowService.runWorkflow(uuid);
      notification.success({
        message: 'Workflow queued',
        description: `Run ID: ${res.run_id}`,
      });
    } catch {
      notification.error({ message: 'Failed to start run' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '10px 20px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <Space>
          <Input
            prefix={<EditOutlined style={{ color: '#bfbfbf' }} />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workflow name"
            style={{ width: 220, fontWeight: 600 }}
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            style={{ width: 280 }}
          />
        </Space>
        <Space>
          <Button
            icon={<PlayCircleOutlined />}
            loading={running}
            onClick={handleRun}
          >
            Run
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}
          >
            Save Workflow
          </Button>
        </Space>
      </div>
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ padding: 12, background: '#fafafa', borderRight: '1px solid #eee' }}>
          <WorkflowNodePalette />
        </div>
        <div style={{ flex: 1 }}>
          <WorkflowCanvasInner />
        </div>
      </div>
    </div>
  );
}

export default function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasContent />
    </ReactFlowProvider>
  );
}
