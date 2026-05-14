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
 // Import these
import CodeEdge from './CodeEdge';
import StartNode from "./StartNode";
import EndNode from "./EndNode";

const GRID_SIZE_X = 200;
const GRID_SIZE_Y = 20;

// Update nodeTypes to include the new permanent nodes
const nodeTypes = { 
  taskNode: TaskNode,
  startNode: StartNode,
  endNode: EndNode 
};

const edgeTypes = { code: CodeEdge };

const PipelineCanvasInner = () => {
  // Pull deleteNodes from the store
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    deleteNodes 
  } = usePipelineStore();

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        // Add this line to handle the 'Delete' or 'Backspace' keys
        onNodesDelete={deleteNodes} 
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid={true}
        snapGrid={[GRID_SIZE_X, GRID_SIZE_Y]}
        connectionLineType={ConnectionLineType.Step}
        connectionLineStyle={{ stroke: '#1890ff', strokeWidth: 2 }}
        fitView
        // Accessibility: ensure users know they can delete tasks but not boundaries
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background 
          id="stages" 
          variant={BackgroundVariant.Lines} 
          gap={[GRID_SIZE_X, 10000]} 
          color="#ccc" 
          size={1.5}
        />
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