'use client';
import { v4 as uuidv4 } from 'uuid';
import { ReactFlowProvider } from '@xyflow/react';
import { Button, Space, message, Input } from 'antd';
import { PlusOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';
import { usePipelineStore } from "@/store/usePipeStore";
import PipelineCanvasInner from './PipelineCanvasInner';
import { notification } from '@/lib/antd/static';
import '@xyflow/react/dist/style.css';
import { PipelinePayload, PipelineService } from '@/services/pipe.service';
import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function PipelineCanvas() {
  const params = useParams();
  const { nodes, edges, name, setName, addNode, setUuid, setId, getId } = usePipelineStore();
  const [isSaving, setIsSaving] = useState(false);
  const [currentUuid, setCurrentUuid] = useState<string | null>(params?.uuid as string || null);
  const handleSave = async () => {

    if (!name?.trim()) {
      return notification.warning({ message: 'Name required', description: 'Please name your pipeline.' });
    }
    setIsSaving(true);

    const targetUuid = currentUuid || uuidv4();
    const currentNodes = usePipelineStore.getState().nodes;
    const currentEdges = usePipelineStore.getState().edges;
    const id = getId();
    const payload: PipelinePayload = {
      id: id,
      pipeline_uuid: targetUuid,
      name: name ?? "Untitled Pipeline",
      org_id: 1,
      workspace_id: 1,
      tasks: currentNodes.map((node) => {
        const incomingEdges = currentEdges.filter((e) => e.target === node.id);
        const edgeData = incomingEdges[0]?.data;
        console.info('saving node details',node)
        return {
          task_key: node.id,
          task_name: (node.data?.label as string) ?? `Task ${node.id}`,

          // 1. Force conversion to Number
          // 2. Use a specific numeric fallback
          connection_id: Number(node.data?.connection_id || 0),

          depends_on: incomingEdges.map((e) => e.source),
          transform_code: (edgeData?.code as string) ?? "",
          func_name: (edgeData?.func_name as string) ?? "",
        };
      }),
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
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={() => {
                const id = `node_${nodes.length + 1}`;
                addNode({
                  id,
                  type: 'task', // Ensure this matches your registered node type name
                  position: { x: (nodes.length + 1) * 200 - 55, y: 150 },
                  data: {
                    label: `Task ${nodes.length + 1}`,
                    connectionId: 1, // Use camelCase to match TaskNode state logic
                    // IMPORTANT: Pass the store's update function so the node can save choices
                    onConfigChange: (nodeId: string, newItem: any) => {
                      usePipelineStore.getState().updateNodeData(nodeId, {
                        connectionId: newItem.id,
                        config: newItem
                      });
                    }
                  },
                });
              }}
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
          </Space>
        </div>

        <div style={{ flexGrow: 1 }}>
          <PipelineCanvasInner />
        </div>
      </div>
    </ReactFlowProvider>
  );
}