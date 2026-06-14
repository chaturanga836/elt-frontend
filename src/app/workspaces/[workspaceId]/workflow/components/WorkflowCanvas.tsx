'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Button, Input, Space } from 'antd';
import {
  SaveOutlined,
  PlayCircleOutlined,
  EditOutlined,
  BugOutlined,
} from '@ant-design/icons';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import WorkflowCanvasInner from './WorkflowCanvasInner';
import WorkflowDebugDrawer from './WorkflowDebugDrawer';
import WorkflowNodePalette from './WorkflowNodePalette';
import { WorkflowService } from '@/services/workflow.service';
import { notification } from '@/lib/antd/static';
import { buildWorkflowSavePayload } from '@/lib/buildWorkflowSavePayload';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';

function WorkflowCanvasContent() {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
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
    uuid: storeUuid,
  } = useWorkflowStore();
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const routeWorkflowUuid =
    typeof params?.id === 'string' && params.id !== 'new' ? params.id : null;

  const buildPayload = () => {
    const workflowUuid = storeUuid || routeWorkflowUuid || uuidv4();
    return buildWorkflowSavePayload({
      nodes,
      edges,
      name,
      description,
      workspaceId,
      workflowId: getId(),
      workflowUuid,
      viewport: getViewport(),
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      notification.warning({ message: 'Workflow name is required' });
      return;
    }

    const taskWithoutScript = nodes.filter((n) => {
      if (n.type !== 'taskNode') return false;
      const data = n.data as Record<string, unknown>;
      const taskId = data.task_id ?? (data.config as { id?: number } | undefined)?.id;
      return !taskId;
    });
    if (taskWithoutScript.length > 0) {
      notification.warning({
        message: 'Task node missing script',
        description: 'Select a script for every Task node before saving.',
      });
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
      setUuid(payload.workflow_uuid);
      notification.success({ message: 'Workflow saved' });
    } catch (e) {
      notification.error({ message: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    const uuid = storeUuid || routeWorkflowUuid;
    if (!uuid) {
      notification.warning({ message: 'Save workflow before running' });
      return;
    }
    setRunning(true);
    try {
      const res = await WorkflowService.runWorkflow(workspaceId, uuid);
      notification.success({
        message: 'Workflow queued',
        description: `Run ID: ${res.run_id}`,
      });
      if (res.run_id) {
        router.push(workspacePath(workspaceId, `workflow/runs/${res.run_id}`));
      }
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
            icon={<BugOutlined />}
            disabled={!storeUuid && !routeWorkflowUuid}
            onClick={() => setDebugOpen(true)}
          >
            Debug
          </Button>
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
      <WorkflowDebugDrawer
        open={debugOpen}
        workflowUuid={storeUuid || routeWorkflowUuid}
        onClose={() => setDebugOpen(false)}
      />
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
