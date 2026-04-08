'use client';

import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { useState, useCallback } from 'react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  // Time 0: Parallel Starts
  { 
    id: 'n1', 
    type: 'connection', 
    position: { x: 50, y: 50 }, 
    data: { label: 'Task 1 (Weather)' } 
  },
  { 
    id: 'n2', 
    type: 'connection', 
    position: { x: 50, y: 250 }, 
    data: { label: 'Task 2 (Crypto)' } 
  },
  
  // Time 1: The "Join" Task (Sequence starts only after 1 & 2 finish)
  { 
    id: 'n3', 
    type: 'connection', 
    position: { x: 450, y: 150 }, 
    data: { label: 'Task 3 (Sync & Report)' } 
  },
];

const initialEdges = [
  // Line from 1 to 3
  { id: 'e1-3', source: 'n1', target: 'n3', type: 'step', animated: true },
  // Line from 2 to 3
  { id: 'e2-3', source: 'n2', target: 'n3', type: 'step', animated: true },
];

const PipelineCanvas = () => {

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params: any) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      />
    </div>
  );
};

export default PipelineCanvas;