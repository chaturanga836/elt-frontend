'use client';

import { usePipelineStore } from "@/store/usePipeStore";
import { 
  Background, 
  Controls, 
  ReactFlow, 
  ConnectionLineType, 
  BackgroundVariant 
} from "@xyflow/react";
import TaskNode from './TaskNode';
import CodeEdge from './CodeEdge';

// Constants to ensure visual sync with the store's snapping logic
const GRID_SIZE_X = 200;
const GRID_SIZE_Y = 20;

const nodeTypes = { connection: TaskNode };
const edgeTypes = { code: CodeEdge };

const PipelineCanvasInner = () => {
  // We only pull what the canvas needs to render and interact with the graph
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = usePipelineStore();

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // Interaction & Grid Config
        snapToGrid={true}
        snapGrid={[GRID_SIZE_X, GRID_SIZE_Y]}
        connectionLineType={ConnectionLineType.Step}
        connectionLineStyle={{ stroke: '#1890ff', strokeWidth: 2 }}
        fitView
      >
        {/* Stages (Vertical Lines) */}
        <Background 
          id="stages" 
          variant={BackgroundVariant.Lines} 
          gap={[GRID_SIZE_X, 10000]} 
          color="#ccc" 
          size={1.5}
        />
        {/* Lanes (Horizontal Lines) */}
        <Background 
          id="lanes" 
          variant={BackgroundVariant.Lines} 
          gap={[10000, GRID_SIZE_Y]} 
          color="#f0f0f0" 
          size={1}
        />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default PipelineCanvasInner;