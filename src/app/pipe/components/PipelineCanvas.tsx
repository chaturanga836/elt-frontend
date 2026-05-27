'use client';
import { v4 as uuidv4 } from 'uuid';
import { Node, Edge, useReactFlow } from '@xyflow/react'; // Removed ReactFlowProvider import
import { Button, Space, Input } from 'antd';
import { PlusOutlined, SaveOutlined, EditOutlined, ApiOutlined } from '@ant-design/icons';
import { usePipelineStore } from "@/store/usePipeStore";
import PipelineCanvasInner from './PipelineCanvasInner';
import { notification } from '@/lib/antd/static';
import '@xyflow/react/dist/style.css';
import { PipelineService } from '@/services/pipe.service';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PipelineCreatePayload } from '@/types/pipetypes';
import { buildBoundaryNodeConfig } from '@/types/boundaryHooks';

export default function PipelineCanvas() {
  const params = useParams();
  const {
    nodes, edges, name, setName, setNodes, setEdges, setUuid,
    setId, getId, getNodes, updateNodePosition
  } = usePipelineStore();

  const [isSaving, setIsSaving] = useState(false);
  const [currentUuid, setCurrentUuid] = useState<string | null>(params?.uuid as string || null);
  
  // This hook now talks to the Provider in your NewPipelinePage
  const { getViewport } = useReactFlow();


const clickAddNode = (nodeType: 'taskNode' | 'restNode' = 'taskNode') => {
  const currentNodes = getNodes();

  // 1. Safely match types using string literals from your active data log
  const startNode = currentNodes.find(n => n.type === 'startNode');
  const endNode = currentNodes.find(n => n.type === 'endNode');
  const taskNodes = currentNodes.filter(n => n.type === 'taskNode');

  // 2. Find the reference x-coordinate
  const referenceNode = taskNodes.length > 0 
    ? taskNodes.reduce((prev, curr) => (prev.position.x > curr.position.x ? prev : curr))
    : startNode;

  const newX = (referenceNode?.position.x ?? 0) + 200;
  
  // 3. Shift the end node if it collides with the prospective new node coordinate
  if (endNode && newX >= endNode.position.x) {
    updateNodePosition(endNode.id, { x: newX + 200, y: endNode.position.y });
  }

  const newTrackingId = uuidv4().substring(0, 8);

  // 4. Force strict explicit typing onto the new object declaration
  const newNode: Node = {
    id: newTrackingId,
    type: nodeType,
    position: { x: newX, y: 200 },
    data: { 
      label: nodeType === 'restNode' ? `REST ${taskNodes.length + 1}` : `Task ${taskNodes.length + 1}`, 
      node_uuid: `task_${uuidv4()}`,
      id: undefined 
    }
  };

  // 5. Combine and sort your data array explicitly across the X-axis positions
  const allNodesSorted: Node[] = [...currentNodes, newNode].sort(
    (a, b) => a.position.x - b.position.x
  );

  // 6. Regenerate visual edge connections using the freshly sorted spatial index sequence
  const newEdges: Edge[] = [];
  for (let i = 0; i < allNodesSorted.length - 1; i++) {
    const sourceNode = allNodesSorted[i];
    const targetNode = allNodesSorted[i + 1];

    newEdges.push({
      id: `e-${sourceNode.id}-${targetNode.id}`,
      source: sourceNode.id,
      target: targetNode.id,
      animated: true,
      style: { strokeWidth: 2 }
    });
  }

  // 7. Fire atomic store setters
  setNodes(allNodesSorted);
  setEdges(newEdges);
};

  const mapNodeTypeToInt = (typeString: string | undefined): 0 | 1 | 2 | 3 => {
    if (typeString === 'startNode') return 0;
    if (typeString === 'taskNode') return 1;
    if (typeString === 'endNode') return 2;
    if (typeString === 'restNode') return 3;
    return 1; // Default fallback to execution node (taskNode)
  };

  const handleSave = async () => {
    if (!name?.trim()) {
      return notification.warning({ message: 'Name required', description: 'Please name your pipeline.' });
    }

    setIsSaving(true);
    const targetUuid = currentUuid || uuidv4();
    const id = getId();

const payload: PipelineCreatePayload = {
    ...(id && { id }),
    pipeline_uuid: targetUuid,
    name: name ?? "Untitled Pipeline",
    org_id: 1,
    workspace_id: 1,
    canvas_structure: {
      nodes: nodes,
      edges: edges,
      viewport: getViewport()
    },
    // 2. Map React Flow nodes smoothly into your binary routing matrix schema
    tasks: nodes.map((node, index) => {
      // Find all inward targeted connections for this specific node element
      const parentEdges = edges.filter((edge) => edge.target === node.id);
      
      // Pull IDs for dependencies (falls back to null if no connection exists)
      const leftParentId = nodes[index -1]?.id || null;
      const rightParentId = nodes[index + 1]?.id || null;

      const nodeType = mapNodeTypeToInt(node.type);
      const isBoundary = nodeType === 0 || nodeType === 2;
      const nodeConfig = buildBoundaryNodeConfig(
        node.data as Record<string, unknown>,
        nodeType === 2,
      );

      return {
        node_uuid: node.id,
        id: node.data?.id ? Number(node.data.id) : undefined,
        node_type: nodeType,
        task_id: isBoundary
          ? (nodeConfig.hook_task_id ?? null)
          : (node.data?.task_id as number) ?? null,
        node_config: nodeConfig,
        left_depend: leftParentId,
        right_depend: rightParentId,
      };
    }),
  };

    try {
      let data;
      if (id) {
        data = await PipelineService.UpdatePipeline(id, payload);
      } else {
        data = await PipelineService.savePipeline(payload);
        setId(data.pipeline.pipeline_id);
      }
      notification.success({
        message: 'Pipeline Saved',
        description: `Successfully saved.`,
      });
      setUuid(targetUuid);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    /* REMOVED ReactFlowProvider from here */
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '10px 20px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <Space size="middle">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => clickAddNode('taskNode')}
          >
            Add Task
          </Button>
          <Button
            icon={<ApiOutlined />}
            onClick={() => clickAddNode('restNode')}
          >
            Add REST Endpoint
          </Button>

          <div style={{ width: '1px', height: '24px', background: '#f0f0f0', margin: '0 8px' }} />

          <Input
            prefix={<EditOutlined style={{ color: '#bfbfbf' }} />}
            value={name ?? ''}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Pipeline Name"
            variant="borderless"
            style={{
              fontSize: '15px',
              fontWeight: 600,
              width: '250px',
              backgroundColor: '#f5f5f5',
              borderRadius: '6px'
            }}
          />
        </Space>

        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={isSaving}
            onClick={handleSave}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', borderRadius: '6px' }}
          >
            Save Pipeline
          </Button>
        </Space>
      </div>

      <div style={{ flexGrow: 1 }}>
        <PipelineCanvasInner />
      </div>
    </div>
  );
}