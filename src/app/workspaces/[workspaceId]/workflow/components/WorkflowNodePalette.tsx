'use client';

import { Button, Card, Typography } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { Node } from '@xyflow/react';
import { useWorkflowStore } from '@/store/useWorkflowStore';

const { Text } = Typography;

const PALETTE = [
  { type: 'taskNode', label: 'Task', color: '#1890ff' },
  { type: 'pipelineNode', label: 'Pipeline', color: '#722ed1' },
  { type: 'conditionNode', label: 'If / Else', color: '#fa8c16' },
  { type: 'parallelForkNode', label: 'Parallel Split', color: '#13c2c2' },
  { type: 'parallelJoinNode', label: 'Parallel Join', color: '#08979c' },
];

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
    <Card size="small" title="Add nodes" style={{ width: 200 }}>
      <div className="flex flex-col gap-2">
        {PALETTE.map((item) => (
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
        Drag connections between handles. Use Yes/No on If/Else nodes.
      </Text>
    </Card>
  );
}
