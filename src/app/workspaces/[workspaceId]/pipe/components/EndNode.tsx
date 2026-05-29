'use client';

import { usePipelineStore } from '@/store/usePipeStore';
import { CheckCircleFilled } from '@ant-design/icons';
import { Handle, Position } from '@xyflow/react';
import { Avatar, Card, Flex, Typography } from 'antd';
import BoundaryHookPanel from '@/features/orchestration/BoundaryHookPanel';

const { Text } = Typography;

const EndNode = ({ id, data }: { id: string; data: Record<string, unknown> }) => {
  const updateNodeData = usePipelineStore((state) => state.updateNodeData);
  const selected = data.config as { name?: string } | null;

  return (
    <div className="end-node">
      <Handle type="target" position={Position.Left} style={{ background: '#f5222d' }} />
      <Card
        size="small"
        style={{
          width: 200,
          background: '#fff1f0',
          border: selected ? '1px solid #f5222d' : '1px dashed #ffa39e',
        }}
        styles={{ body: { padding: '8px' } }}
      >
        <Flex align="center" gap={6} className="mb-2">
          <Avatar
            size={20}
            shape="square"
            icon={<CheckCircleFilled />}
            style={{ backgroundColor: '#f5222d' }}
          />
          <Text strong style={{ fontSize: 11 }}>
            End
          </Text>
        </Flex>
        <BoundaryHookPanel
          variant="end"
          nodeId={id}
          data={data as Parameters<typeof BoundaryHookPanel>[0]['data']}
          onUpdate={updateNodeData}
          compact
        />
      </Card>
    </div>
  );
};

export default EndNode;
