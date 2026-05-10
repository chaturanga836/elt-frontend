'use client';
import { v4 as uuidv4 } from 'uuid';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { Button, Space, message, Input } from 'antd';
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
  const { nodes, edges, name, setName, addNode, setUuid, setId, getId } = usePipelineStore();
  const [isSaving, setIsSaving] = useState(false);
  const [currentUuid, setCurrentUuid] = useState<string | null>(params?.uuid as string || null);
  const { getViewport } = useReactFlow();

  const handleSave = async () => {

    if (!name?.trim()) {
      return notification.warning({ message: 'Name required', description: 'Please name your pipeline.' });
    }
    setIsSaving(true);

    const targetUuid = currentUuid || uuidv4();

    const id = getId();

    const payload: PipelineCreatePayload = {
      // Only include ID if we are updating an existing record
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
        is_start_node: edges.filter((e) => e.target === node.id).length === 0,
        connection_id: Number(node.data?.connectionId || 0),
        depends_on: edges.filter((e) => e.target === node.id).map((e) => e.source),
        transform_code: (node.data?.transformCode as string) ?? "",
        func_name: (node.data?.func_name as string) ?? `func_${node.id}`,
        input_mapping: (node.data?.inputMapping as InputMapping) || ({} as InputMapping)
      })),
    };
    console.info("Saving Pipeline with payload:", payload);
    try {

      let data;
      if (id) {
        data = await PipelineService.UpdatePipeline(id, payload);
        setId(data.id); // Update the store with the returned ID (in case it was a new pipeline)
      } else {
        data = await PipelineService.savePipeline(payload);
        setId(data.pipeline.pipeline_id);
      }
      notification.success({
        title: 'Pipeline Saved',
        description: `Version ${data.version} created successfully.`,
      });

      setUuid(currentUuid);
      setCurrentUuid(data.pipeline_uuid);
    } catch (err) {
      // Interceptor handles the visual error, we just stop the loading state
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const clickAddNode = async () => {
    const id = `node_${nodes.length + 1}`;
    addNode({
      id,
      type: 'task',
      position: { x: nodes.length * 250, y: 150 },
      data: {
        label: `Task ${nodes.length + 1}`,
        connectionId: null, // Start empty
        transformCode: "",  // Keep logic inside the node data
        funcName: `func_${id}`,
        onConfigChange: (nodeId: string, newItem: any) => {
          usePipelineStore.getState().updateNodeData(nodeId, {
            connectionId: newItem.id,
            // If the user edits code in a drawer, update transformCode here
          });
        }
      },
    });
  };

  return (
    <ReactFlowProvider>
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* ENHANCED TOOLBAR */}
        <div style={{
          padding: '10px 20px',
          background: '#fff',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100
        }}>
          <Space size="middle">
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={() => clickAddNode()}
            >
              Task Node
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Save Pipeline
            </Button>
            <Input
              prefix={<EditOutlined style={{ color: '#bfbfbf' }} />}
              value={name ?? ''}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Pipeline Name"
              variant="borderless"
              style={{
                fontSize: '16px',
                fontWeight: 600,
                width: '300px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px'
              }}
            />
          </Space>

          <Space>

          </Space>
        </div>

        <div style={{ flexGrow: 1 }}>
          <PipelineCanvasInner />
        </div>
      </div>
    </ReactFlowProvider>
  );
}