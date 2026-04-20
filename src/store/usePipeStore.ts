import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from '@xyflow/react';

// Configuration for snapping - matches your Canvas setup
const GRID_SIZE_X = 200;
const GRID_SIZE_Y = 20;
const NODE_WIDTH = 110;

interface PipelineState {
  nodes: Node[];
  edges: Edge[];
  name: string | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  updateEdgeData: (edgeId: string, data: any) => void;
  setName: (name: string | null) => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  nodes: [],
  edges: [],
  name: null,
  setName: (name) => set({ name }),
  // SNAP-TO-GRID LOGIC MOVED HERE
  onNodesChange: (changes) => {
    const snappedChanges = changes.map((change) => {
      if (change.type === 'position' && change.position) {
        return {
          ...change,
          position: {
            // Horizontal snap (Stages)
            x: Math.round(change.position.x / GRID_SIZE_X) * GRID_SIZE_X - (NODE_WIDTH / 2),
            // Vertical snap (Lanes)
            y: Math.round(change.position.y / GRID_SIZE_Y) * GRID_SIZE_Y,
          },
        };
      }
      return change;
    });

    set({
      nodes: applyNodeChanges(snappedChanges, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    // Check if edge already exists to prevent duplicates
    const edges = get().edges;
    const isDuplicate = edges.some(
      (e) => e.source === connection.source && e.target === connection.target
    );

    if (isDuplicate) return;

    const newEdge: Edge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}`,
      type: 'code',
      animated: true,
      data: { 
        code: '', 
        func_name: `fn_${Math.random().toString(36).slice(2, 7)}` 
      }
    };
    
    set({
      edges: addEdge(newEdge, edges),
    });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  addNode: (node) => set({ nodes: [...get().nodes, node] }),

  updateEdgeData: (edgeId, data) => {
    set({
      edges: get().edges.map((edge) => 
        edge.id === edgeId ? { ...edge, data: { ...edge.data, ...data } } : edge
      ),
    });
  },
}));