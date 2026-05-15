'use client';
import { v4 as uuidv4 } from 'uuid';
import { useReactFlow } from '@xyflow/react'; // Removed ReactFlowProvider import
import { Button, Space, Input } from 'antd';
import { PlusOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';
import { usePipelineStore } from "@/store/usePipeStore";
import PipelineCanvasInner from './PipelineCanvasInner';
import { notification } from '@/lib/antd/static';
import '@xyflow/react/dist/style.css';
import { PipelineService } from '@/services/pipe.service';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { InputMapping, PipelineCreatePayload, TaskType } from '@/types/pipetypes';

export default function PipelineCanvas() {
  const params = useParams();
  const {
    nodes, edges, name, setName, addNode, setUuid,
    setId, getId, getNodes, updateNodePosition
  } = usePipelineStore();

  const [isSaving, setIsSaving] = useState(false);
  const [currentUuid, setCurrentUuid] = useState<string | null>(params?.uuid as string || null);
  
  // This hook now talks to the Provider in your NewPipelinePage
  const { getViewport } = useReactFlow();

  const clickAddNode = (nodeType: 'taskNode') => {
    const currentNodes = getNodes();
    // Match IDs 'start' and 'end' as defined in your DEFAULT_NODES
    const startNode = currentNodes.find(n => n.id === 'start');
    const endNode = currentNodes.find(n => n.id === 'end');

    const taskNodes = currentNodes.filter(n => n.type === 'taskNode');
    const referenceNode = taskNodes.length > 0 
      ? taskNodes.reduce((prev, curr) => (prev.position.x > curr.position.x ? prev : curr))
      : startNode;

    const newX = (referenceNode?.position.x ?? 0) + 200;
    
    if (endNode && newX >= endNode.position.x) {
      updateNodePosition(endNode.id, { x: newX + 200, y: endNode.position.y });
    }

    const id = `task_${uuidv4().substring(0, 8)}`;
    const newNode = {
      id,
      type: 'taskNode',
      position: { x: newX, y: 200 },
      data: { label: `Task ${taskNodes.length + 1}` },
    };

    addNode(newNode);
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
      tasks: nodes.map((node) => ({
        task_key: node.id,
        task_type: (node.type as TaskType) || 'task',
        is_start_node: node.type === 'startNode',
        connection_id: Number(node.data?.connectionId || 0),
        depends_on: edges.filter((e) => e.target === node.id).map((e) => e.source),
        transform_code: (node.data?.transformCode as string) ?? "",
        func_name: (node.data?.func_name as string) ?? `func_${node.id}`,
        input_mapping: (node.data?.inputMapping as InputMapping) || ({} as InputMapping)
      })),
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