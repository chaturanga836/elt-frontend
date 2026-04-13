'use client';

import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlowProvider,
  ConnectionLineType,
  Connection, // Type for the drag event
  Edge
} from '@xyflow/react';
import { useState, useCallback } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import TaskNode from './TaskNode';
import '@xyflow/react/dist/style.css';
import CodeEdge from './CodeEdge';

const nodeTypes = {
  connection: TaskNode,
};

const edgeTypes = {
  code: CodeEdge,
};

const GRID_SIZE_X = 200; // Horizontal "Time" step
const GRID_SIZE_Y = 20;  // Vertical "Lane" step
const NODE_WIDTH = 110;
const NODE_HEIGHT = 40;

const PipelineCanvasInner = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = useCallback(
    (changes: any) => {
      setNodes((nds) => {
        const snappedChanges = changes.map((change: any) => {
          if (change.type === 'position' && change.position) {
            return {
              ...change,
              position: {
                // Standard horizontal snap
                x: (Math.round(change.position.x / GRID_SIZE_X) * GRID_SIZE_X) - (NODE_WIDTH / 2),
                // Snap to line + Offset by half height to center the node on the line
                y: Math.round(change.position.y / GRID_SIZE_Y) * GRID_SIZE_Y,
              },
            };
          }
          return change;
        });
        return applyNodeChanges(snappedChanges, nds);
      });
    },
    [setNodes]
  );;

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  // This triggers when the user finishes dragging from one handle to another
const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}`,
        type: 'code', // CHANGED from 'step' to 'code'
        animated: true,
        style: { stroke: '#1890ff', strokeWidth: 2 }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [],
  );

  const addNewNode = () => {
    const lineX = (nodes.length + 1) * GRID_SIZE_X;
    const id = `node_${nodes.length + 1}`;
    const newNode = {
      id,
      type: 'connection',
      position: { x: lineX - (NODE_WIDTH / 2), y: 150 },
      data: { label: `Task ${nodes.length + 1}` },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={addNewNode}
        style={{ position: 'absolute', top: 20, left: 20, zIndex: 100 }}
      >
        Add Task
      </Button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        // These 3 lines make the DRAGGING look professional
        connectionLineType={ConnectionLineType.Step}
        connectionLineStyle={{ stroke: '#1890ff', strokeWidth: 2 }}
        snapToGrid={true}
        snapGrid={[GRID_SIZE_X, GRID_SIZE_Y]}
        fitView
      >
        <Background id="horizontal-lines" variant={BackgroundVariant.Lines} color="#333" gap={[GRID_SIZE_X, 10000]} size={1.5} />
        <Background
          id="vertical-steps"
          variant={BackgroundVariant.Lines}
          gap={[10000, GRID_SIZE_Y]} // Huge Y gap so only vertical lines show
          color="#f0f0f0"       // Very light grey
          size={1}
        />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default function PipelineCanvas() {
  return (
    <ReactFlowProvider>
      <PipelineCanvasInner />
    </ReactFlowProvider>
  );
}