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
  const { nodes, edges, name, setName, addNode } = usePipelineStore();
  const [isSaving, setIsSaving] = useState(false);
const [currentUuid, setCurrentUuid] = useState<string | null>(params?.uuid as string || null);
  const handleSave = async () => {

    if (!name?.trim()) {
      return notification.warning({ message: 'Name required', description: 'Please name your pipeline.' });
    }
    setIsSaving(true);

    const targetUuid = currentUuid || uuidv4();

    const payload: PipelinePayload = {
      pipeline_uuid: targetUuid,
      name: name ?? "Untitled Pipeline",
      org_id: 1,
      workspace_id: 1,
      tasks: nodes.map((node) => {
        const incomingEdges = edges.filter((e) => e.target === node.id);
        // We assume one primary incoming edge for the code
        const edgeData = incomingEdges[0]?.data;

        return {
          task_key: node.id,
          task_name: (node.data?.label as string) ?? `Task ${node.id}`,
          connection_id: (node.data?.connection_id as number) ?? 1,
          // Match the backend key 'depends_on'
          depends_on: incomingEdges.map((e) => e.source),
          transform_code: (edgeData?.code as string) ?? "",
          func_name: (edgeData?.func_name as string) ?? "",
        };
      }),
    };

    try {
      const data = await PipelineService.savePipeline(payload);
      notification.success({
        title: 'Pipeline Saved',
        description: `Version ${data.version} created successfully.`,
      });
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
                  type: 'connection',
                  position: { x: (nodes.length + 1) * 200 - 55, y: 150 },
                  data: { label: `Task ${nodes.length + 1}`, connection_id: 1 },
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