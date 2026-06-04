'use client';

import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, Avatar, Typography, Flex, Input, Collapse } from 'antd';
import { RocketFilled } from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import BoundaryHookPanel from '@/features/orchestration/BoundaryHookPanel';
import type { BoundaryHookConfig } from '@/types/boundaryHooks';

const { Text } = Typography;

const StartNode = ({ id, data }: { id: string; data: Record<string, unknown> }) => {
  const updateNodeData = usePipelineStore((state) => state.updateNodeData);
  const selected = data.config as { name?: string } | null;
  const nodeConfig = (data.node_config as BoundaryHookConfig) || {};
  const [inputJson, setInputJson] = useState(
    () =>
      nodeConfig.start_input != null
        ? JSON.stringify(nodeConfig.start_input, null, 2)
        : '',
  );

  const persistStartInput = (raw: string) => {
    setInputJson(raw);
    const trimmed = raw.trim();
    let parsed: unknown = null;
    if (trimmed) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        return;
      }
    }
    updateNodeData(id, {
      node_config: {
        ...nodeConfig,
        start_input: trimmed ? parsed : null,
      },
    });
  };

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
        <Collapse
          ghost
          size="small"
          style={{ marginTop: 4 }}
          items={[
            {
              key: 'input',
              label: (
                <Text type="secondary" style={{ fontSize: 10 }}>
                  Initial input (optional)
                </Text>
              ),
              children: (
                <Input.TextArea
                  rows={3}
                  placeholder='{"url": "https://..."}'
                  value={inputJson}
                  onChange={(e) => persistStartInput(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: 10, fontFamily: 'monospace' }}
                />
              ),
            },
          ]}
        />
      </Card>
      <Handle type="source" position={Position.Right} style={{ background: '#52c41a' }} />
    </div>
  );
};

export default StartNode;
