'use client';

import { useCallback } from 'react';
import { usePipelineStore } from '@/store/usePipeStore';
import {
  Background,
  Controls,
  ReactFlow,
  ConnectionLineType,
  BackgroundVariant,
  type Connection,
  type Edge,
} from '@xyflow/react';
import TaskNode from './TaskNode';
import StartNode from './StartNode';
import EndNode from './EndNode';
import RestEndpointNode from './RestEndpointNode';
import DatabaseNode from './DatabaseNode';
import { isValidPipelineConnection } from '@/lib/pipelineChain';
import { usePipeModalActive } from '../PipeModalContext';

const GRID_SIZE_X = 200;
const GRID_SIZE_Y = 20;

const nodeTypes = {
  taskNode: TaskNode,
  restNode: RestEndpointNode,
  dbNode: DatabaseNode,
  startNode: StartNode,
  endNode: EndNode,
};

const edgeTypes = {};

const PipelineCanvasInner = () => {
  const modalActive = usePipeModalActive();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    reconnectChainEdge,
  } = usePipelineStore();

  const isValidConnection = useCallback(
    (connection: Connection | Edge) =>
      isValidPipelineConnection(nodes, connection),
    [nodes],
  );

  const handleReconnect = useCallback(
    (oldEdge: Edge, connection: Connection) => {
      reconnectChainEdge(oldEdge, connection);
    },
    [reconnectChainEdge],
  );

  if (modalActive) {
    return (
      <div
        style={{ width: '100%', height: '100%', position: 'relative' }}
        aria-hidden
      />
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={handleReconnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid={true}
        snapGrid={[GRID_SIZE_X, GRID_SIZE_Y]}
        connectionLineType={ConnectionLineType.Step}
        connectionLineStyle={{ stroke: '#1890ff', strokeWidth: 2 }}
        edgesReconnectable
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
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
