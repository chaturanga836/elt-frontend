'use client';

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ConnectionLineType,
} from '@xyflow/react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import WfStartNode from './nodes/WfStartNode';
import WfEndNode from './nodes/WfEndNode';
import WfTaskNode from './nodes/WfTaskNode';
import WfPipelineNode from './nodes/WfPipelineNode';
import WfConditionNode from './nodes/WfConditionNode';
import WfParallelForkNode from './nodes/WfParallelForkNode';
import WfParallelJoinNode from './nodes/WfParallelJoinNode';

const nodeTypes = {
  startNode: WfStartNode,
  endNode: WfEndNode,
  taskNode: WfTaskNode,
  pipelineNode: WfPipelineNode,
  conditionNode: WfConditionNode,
  parallelForkNode: WfParallelForkNode,
  parallelJoinNode: WfParallelJoinNode,
};

export default function WorkflowCanvasInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    deleteNodes,
  } = useWorkflowStore();

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={deleteNodes}
        nodeTypes={nodeTypes}
        snapToGrid
        snapGrid={[20, 20]}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
