'use client';
import { v4 as uuidv4 } from 'uuid';
import { Node, useReactFlow } from '@xyflow/react';
import { Button, Input, Typography } from 'antd';
import { PlusOutlined, SaveOutlined, EditOutlined, ApiOutlined, DatabaseOutlined, BugOutlined, ReloadOutlined } from '@ant-design/icons';
import { usePipelineStore } from "@/store/usePipeStore";
import PipelineCanvasInner from './PipelineCanvasInner';
import PipelineDebugDrawer from './PipelineDebugDrawer';
import { notification } from '@/lib/antd/static';
import '@xyflow/react/dist/style.css';
import { PipelineService } from '@/services/pipe.service';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PipelineCreatePayload } from '@/types/pipetypes';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { buildPipelineNodeConfig, coerceOptionalTaskId } from '@/types/pipelineNodeConfig';
import type { PipelineTask } from '@/types/pipetypes';
import {
  PIPELINE_NAME_PLACEHOLDER,
  isPipelineNameValid,
  pipelineNameValidationMessage,
} from '@/lib/validatePipelineName';
import {
  insertNodeBeforeTarget,
  isCompleteLinearChain,
  orderNodesFromEdges,
} from '@/lib/pipelineChain';
import styles from '../pipeline-editor.module.css';

const { Text } = Typography;

export default function PipelineCanvas() {
  const workspaceId = useWorkspaceId();
  const params = useParams();
  const {
    nodes, edges, name, uuid, setName, setNodes, setEdges, setUuid,
    setId, getId, getCurrentUuid, getNodes, getEdges, updateNodePosition
  } = usePipelineStore();

  const [isSaving, setIsSaving] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugSessionKey, setDebugSessionKey] = useState(0);
  const routePipelineUuid =
    typeof params?.id === 'string' && params.id !== 'new' ? params.id : null;
  const debugPipelineUuid = getCurrentUuid() || uuid || routePipelineUuid;

  const openDebugPanel = () => {
    setDebugSessionKey((k) => k + 1);
    setDebugOpen(true);
  };

  const resetDebugSession = () => {
    setDebugSessionKey((k) => k + 1);
  };

  const closeDebugPanel = () => {
    setDebugOpen(false);
  };
  
  // Requires ReactFlowProvider from pipe/layout.tsx
  const { getViewport } = useReactFlow();


const clickAddNode = (nodeType: 'taskNode' | 'restNode' | 'dbNode' = 'taskNode') => {
  const currentNodes = getNodes();
  const currentEdges = getEdges();
  const endNode = currentNodes.find((n) => n.type === 'endNode');
  const taskNodes = currentNodes.filter(
    (n) => n.type === 'taskNode' || n.type === 'restNode' || n.type === 'dbNode',
  );
  const orderedNodes = orderNodesFromEdges(currentNodes, currentEdges);
  const predecessor = orderedNodes.length >= 2 ? orderedNodes[orderedNodes.length - 2] : orderedNodes[0];
  const newX = (predecessor?.position.x ?? 0) + 200;

  if (endNode && newX >= endNode.position.x) {
    updateNodePosition(endNode.id, { x: newX + 200, y: endNode.position.y });
  }

  const newTrackingId = uuidv4().substring(0, 8);
  const newNode: Node = {
    id: newTrackingId,
    type: nodeType,
    position: { x: newX, y: 200 },
    deletable: false,
    data: {
      label:
        nodeType === 'restNode'
          ? `Connection ${taskNodes.length + 1}`
          : nodeType === 'dbNode'
            ? `Database ${taskNodes.length + 1}`
            : `Script ${taskNodes.length + 1}`,
      node_uuid: `task_${uuidv4()}`,
      id: undefined,
    },
  };

  setNodes([...currentNodes, newNode]);
  if (endNode) {
    setEdges(insertNodeBeforeTarget(currentEdges, newTrackingId, endNode.id));
  }
};

  const mapNodeTypeToInt = (typeString: string | undefined): 0 | 1 | 2 | 3 | 4 => {
    if (typeString === 'startNode') return 0;
    if (typeString === 'taskNode') return 1;
    if (typeString === 'endNode') return 2;
    if (typeString === 'restNode') return 3;
    if (typeString === 'dbNode') return 4;
    return 1; // Default fallback to execution node (taskNode)
  };

  const handleSave = async () => {
    const nameError = pipelineNameValidationMessage(name);
    if (nameError) {
      return notification.warning({ message: 'Invalid pipeline name', description: nameError });
    }

    const trimmedName = name!.trim();

    if (!isCompleteLinearChain(nodes, edges)) {
      return notification.warning({
        message: 'Pipeline links incomplete',
        description:
          'Connect every node in one path from Start to End. Select a link and press Delete to remove it, then drag handles to reconnect.',
      });
    }

    const orderedNodes = orderNodesFromEdges(nodes, edges);

    const hasRestNode = nodes.some((n) => n.type === 'restNode');
    const hasScraperParseTask = nodes.some((n) => {
      if (n.type !== 'taskNode') return false;
      const cfg = (n.data as Record<string, unknown>)?.config as { name?: string } | undefined;
      const taskName = (cfg?.name || (n.data as Record<string, unknown>)?.label || '') as string;
      return /parse\s+scraper|scraper\s+response/i.test(taskName);
    });
    if (hasScraperParseTask && !hasRestNode) {
      return notification.warning({
        message: 'Scraper pipeline incomplete',
        description:
          'This task only parses scraper output. Add REST Endpoint between Start and the parse task, select your Scrape URL connection, then save.',
      });
    }

    const restWithoutConnection = nodes.filter(
      (n) =>
        n.type === 'restNode' &&
        !(n.data as Record<string, unknown>)?.rest_connection_id &&
        !((n.data as Record<string, unknown>)?.node_config as Record<string, unknown>)
          ?.rest_connection_id,
    );
    if (restWithoutConnection.length > 0) {
      return notification.warning({
        message: 'REST endpoint not configured',
        description:
          'Open each REST node and select your saved Scrape URL connection before saving.',
      });
    }

    const dbWithoutConnection = nodes.filter(
      (n) =>
        n.type === 'dbNode' &&
        !(n.data as Record<string, unknown>)?.connection_id &&
        !((n.data as Record<string, unknown>)?.node_config as Record<string, unknown>)
          ?.connection_id,
    );
    if (dbWithoutConnection.length > 0) {
      return notification.warning({
        message: 'Database node not configured',
        description:
          'Open each Database node and select your saved DB connection before saving.',
      });
    }

    setIsSaving(true);
    const pipelineId = getId();
    const targetUuid = getCurrentUuid() || uuid || routePipelineUuid || uuidv4();

const payload: PipelineCreatePayload = {
    ...(pipelineId && { id: pipelineId }),
    pipeline_uuid: targetUuid,
    name: trimmedName,
    org_id: 1,
    workspace_id: workspaceId,
    canvas_structure: {
      nodes,
      edges,
      viewport: getViewport(),
    },
    tasks: orderedNodes.map((node, index): PipelineTask => {
      const leftParentId = index > 0 ? orderedNodes[index - 1].id : null;
      const rightParentId =
        index < orderedNodes.length - 1 ? orderedNodes[index + 1].id : null;

      const nodeType = mapNodeTypeToInt(node.type);
      const isBoundary = nodeType === 0 || nodeType === 2;
      const nodeConfig = buildPipelineNodeConfig(
        node.data as Record<string, unknown>,
        nodeType,
      );

      const nodeData = node.data as Record<string, unknown>;
      const config = nodeData.config as { name?: string } | undefined;
      const label =
        config?.name ||
        (nodeData.label as string) ||
        (nodeType === 0 ? 'Start' : nodeType === 2 ? 'End' : 'Task');

      return {
        node_uuid: node.id,
        id: nodeData.id ? Number(nodeData.id) : undefined,
        name: label,
        node_type: nodeType,
        task_id: isBoundary
          ? coerceOptionalTaskId(nodeConfig.hook_task_id)
          : coerceOptionalTaskId(nodeData.task_id),
        node_config: nodeConfig,
        left_depend: leftParentId,
        right_depend: rightParentId,
      };
    }),
  };

    try {
      if (pipelineId) {
        await PipelineService.UpdatePipeline(pipelineId, payload);
      } else {
        const data = await PipelineService.savePipeline(payload);
        setId(data.pipeline_id);
      }
      notification.success({
        message: 'Pipeline Saved',
        description: 'Successfully saved.',
      });
      setUuid(targetUuid);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.editorShell}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => clickAddNode('taskNode')}
          >
            Add Script Node
          </Button>
          <Button icon={<ApiOutlined />} onClick={() => clickAddNode('restNode')}>
            Add Connection Node
          </Button>
          <Button icon={<DatabaseOutlined />} onClick={() => clickAddNode('dbNode')}>
            Add Database Node
          </Button>

          <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
            Connect edges to set run order (Delete removes a link)
          </Text>

          <div style={{ width: 1, height: 24, background: '#f0f0f0', margin: '0 4px' }} />

          <Input
            prefix={<EditOutlined style={{ color: '#bfbfbf' }} />}
            value={name ?? ''}
            onChange={(e) => setName(e.target.value)}
            placeholder={PIPELINE_NAME_PLACEHOLDER}
            status={name && !isPipelineNameValid(name) ? 'error' : undefined}
            variant="borderless"
            style={{
              fontSize: 15,
              fontWeight: 600,
              width: 250,
              maxWidth: 'min(250px, 40vw)',
              backgroundColor: '#f5f5f5',
              borderRadius: 6,
            }}
          />
        </div>

        <div className={styles.toolbarRight}>
          <Button
            size="small"
            icon={<BugOutlined />}
            type={debugOpen ? 'primary' : 'default'}
            onClick={openDebugPanel}
          >
           Open Debug
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            disabled={!debugOpen}
            onClick={resetDebugSession}
          >
            Reset
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={isSaving}
            disabled={!isPipelineNameValid(name)}
            onClick={handleSave}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', borderRadius: 6 }}
          >
            Save Pipeline
          </Button>
        </div>
      </header>

      <div className={styles.canvasArea}>
        <PipelineCanvasInner />
      </div>

      <PipelineDebugDrawer
        key={debugSessionKey}
        open={debugOpen}
        pipelineUuid={debugPipelineUuid}
        onClose={closeDebugPanel}
      />
    </div>
  );
}