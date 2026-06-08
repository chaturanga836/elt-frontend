'use client';

import { Button, Card, Typography } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { Node } from '@xyflow/react';
import { useWorkflowStore } from '@/store/useWorkflowStore';

const { Text } = Typography;

const PRIMARY_PALETTE = [
  { type: 'pipelineNode', label: 'Pipeline', color: '#722ed1' },
  { type: 'parallelForkNode', label: 'Parallel Split', color: '#13c2c2' },
  { type: 'parallelJoinNode', label: 'Parallel Join', color: '#08979c' },
] as const;

const SECONDARY_PALETTE = [
  { type: 'taskNode', label: 'Task (glue)', color: '#1890ff' },
  { type: 'conditionNode', label: 'If / Else (rare)', color: '#fa8c16' },
] as const;

export default function WorkflowNodePalette() {
  const addNode = useWorkflowStore((s) => s.addNode);
  const nodes = useWorkflowStore((s) => s.nodes);

  const addPaletteNode = (type: string, label: string) => {
    const id = `${type.replace('Node', '')}_${uuidv4().slice(0, 8)}`;
    const maxX = Math.max(...nodes.map((n) => n.position.x), 200);
    const newNode: Node = {
      id,
      type,
      position: { x: maxX + 180, y: 180 + Math.random() * 80 },
      data: {
        label,
        node_config: type === 'conditionNode' ? { expression: 'True' } : {},
      },
    };
    addNode(newNode);
  };

  return (
    <Card size="small" title="Add nodes" style={{ width: 220 }}>
      <Text type="secondary" className="text-[10px] block mb-2">
        Best for: run multiple pipelines, parallel fan-out/join, workspace-level jobs.
      </Text>
      <div className="flex flex-col gap-2">
        {PRIMARY_PALETTE.map((item) => (
          <Button
            key={item.type}
            block
            size="small"
            onClick={() => addPaletteNode(item.type, item.label)}
            style={{ borderColor: item.color, color: item.color }}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <Text type="secondary" className="text-[10px] block mt-3 mb-1">
        Optional
      </Text>
      <div className="flex flex-col gap-2">
        {SECONDARY_PALETTE.map((item) => (
          <Button
            key={item.type}
            block
            size="small"
            onClick={() => addPaletteNode(item.type, item.label)}
            style={{ borderColor: item.color, color: item.color }}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <Text type="secondary" className="text-[10px] block mt-3">
        Prefer pipeline scripts for if/else logic. Use Parallel Split + Join with two or
        more outgoing edges; pick the join node on the split.
      </Text>
    </Card>
  );
}
