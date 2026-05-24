'use client';

import { Handle, Position } from '@xyflow/react';
import { Card, Avatar, Typography, Flex } from 'antd';
import { RocketFilled } from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import BoundaryHookPanel from '@/features/orchestration/BoundaryHookPanel';

const { Text } = Typography;

const StartNode = ({ id, data }: { id: string; data: Record<string, unknown> }) => {
  const updateNodeData = usePipelineStore((state) => state.updateNodeData);
  const selected = data.config as { name?: string } | null;

  return (
    <div className="start-node">
      <Card
        size="small"
        style={{
          width: 200,
          background: '#f6ffed',
          border: selected ? '1px solid #52c41a' : '1px dashed #b7eb8f',
        }}
        styles={{ body: { padding: '8px' } }}
      >
        <Flex align="center" gap={6} className="mb-2">
          <Avatar
            size={20}
            shape="square"
            icon={<RocketFilled />}
            style={{ backgroundColor: '#52c41a' }}
          />
          <Text strong style={{ fontSize: 11 }}>
            Start
          </Text>
        </Flex>
        <BoundaryHookPanel
          variant="start"
          nodeId={id}
          data={data as Parameters<typeof BoundaryHookPanel>[0]['data']}
          onUpdate={updateNodeData}
          compact
        />
      </Card>
      <Handle type="source" position={Position.Right} style={{ background: '#52c41a' }} />
    </div>
  );
};

export default StartNode;
