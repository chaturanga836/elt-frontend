'use client';

import { Button, Card, Typography } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { Node } from '@xyflow/react';
import { computeWorkflowNodePosition } from '@/lib/workflowNodePlacement';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { palette } from '@/constants/theme';

const { Text } = Typography;

const PRIMARY_PALETTE = [
  { type: 'pipelineNode', label: 'Pipeline', color: palette.accentPurple },
  { type: 'parallelForkNode', label: 'Parallel Split', color: palette.accentCyan },
  { type: 'parallelJoinNode', label: 'Parallel Join', color: palette.accentCyan },
] as const;

const SECONDARY_PALETTE = [
  { type: 'taskNode', label: 'Task (glue)', color: palette.primary },
  { type: 'conditionNode', label: 'If / Else (rare)', color: palette.primaryLight },
] as const;

export default function WorkflowNodePalette() {
  const addNode = useWorkflowStore((s) => s.addNode);
  const nodes = useWorkflowStore((s) => s.nodes);

  const addPaletteNode = (type: string, label: string) => {
    const id = `${type.replace('Node', '')}_${uuidv4().slice(0, 8)}`;
    const position = computeWorkflowNodePosition(nodes);
    const newNode: Node = {
      id,
      type,
      position,
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
