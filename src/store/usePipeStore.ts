import { create } from 'zustand';
import { 
  Connection, 
  Edge, 
  Node, 
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge 
} from '@xyflow/react';

// Configuration
const GRID_SIZE_X = 200;

interface PipelineState {
  nodes: Node[];
  edges: Edge[];
  name: string | null;
  id: number | null;
  uuid: string | null;
  // Getters & Setters
  getCurrentUuid: () => string | null;
  setUuid: (uuid: string | null) => void;
  setId: (id: number | null) => void;
  getId: () => number | null;
  setName: (name: string | null) => void;
  // React Flow Handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNodeBetween: (type?: string) => void; 
  updateNodeData: (nodeId: string, newData: any) => void;
  updateEdgeData: (edgeId: string, data: any) => void;
  setPipeline: (id: number | null, uuid: string | null, nodes: Node[], edges: Edge[], name: string | null) => void;
  getNodes: () => Node[];
  getEdges: () => Edge[];
  addNode: (newNode: Node) => void;
  deleteNodes: (nodesToDelete: Node[]) => void;
  updateNodePosition: (nodeId: string, position: { x: number, y: number }) => void;
  resetPipeline: () => void;
}

// 1. Define the Fixed Boundary Nodes
const DEFAULT_NODES: Node[] = [
  { 
    id: 'start', // Changed from node-start for simplicity
    type: 'startNode', 
    position: { x: 0, y: 200 }, 
    deletable: false,
    data: { label: 'Start' } 
  },
  { 
    id: 'end',   // Use 'end' consistently
    type: 'endNode', 
    position: { x: 600, y: 200 }, 
    deletable: false, 
    data: { label: 'End' } 
  }
];

const initialEdges: Edge[] = [
  { 
    id: 'e-start-end', 
    source: 'start', // Must match DEFAULT_NODES id
    target: 'end',   // Must match DEFAULT_NODES id
    animated: true,
    type: 'code',    // Ensure this matches your edgeTypes in CanvasInner
    data: { code: '', func_name: 'fn_init' }
  }
];

export const usePipelineStore = create<PipelineState>((set, get) => ({
  // --- Initial State ---
  nodes: DEFAULT_NODES,
  edges: initialEdges,
  name: null,
  uuid: null,
  id: null,

resetPipeline: () => set({ 
    nodes: DEFAULT_NODES, 
    edges: initialEdges, // CRITICAL: Reset must include the edge
    name: 'Untitled Pipeline',
    id: null,
    uuid: null
  }),
  // --- Getters & Setters ---
  getCurrentUuid: () => get().uuid,
  setUuid: (uuid) => set({ uuid }),
  setId: (id) => set({ id }),
  getId: () => get().id,
  setName: (name) => set({ name }),

  // Logic to add a single node
  addNode: (newNode) => set((state) => ({ 
    nodes: [...state.nodes, newNode] 
  })),
  // --- React Flow Handlers ---
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    const edges = get().edges;
    const newEdge: Edge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}`,
      type: 'code',
      animated: true,
      data: { code: '', func_name: `fn_${Math.random().toString(36).slice(2, 7)}` }
    };
    set({ edges: addEdge(newEdge, edges) });
  },

  // --- Actions ---
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  getNodes: () => get().nodes,
  getEdges: () => get().edges,

  addNodeBetween: (type = 'taskNode') => {
    const { nodes, edges } = get();
    const endNode = nodes.find(n => n.id === 'node-end');
    if (!endNode) return;

    const currentEndX = endNode.position.x;
    const newNodeId = `task-${Math.random().toString(36).slice(2, 7)}`;

    const newNode: Node = {
      id: newNodeId,
      type: type,
      position: { x: currentEndX, y: 200 }, // Places it exactly where End was
      data: { label: 'New Task', config: null },
    };

    // Shift End Node to the right and add the new node
    const updatedNodes = nodes.map(n => 
      n.id === 'node-end' 
        ? { ...n, position: { x: n.position.x + GRID_SIZE_X, y: 200 } } 
        : n
    ).concat(newNode);

    // Rewire Edges: Find the edge pointing to 'node-end' and redirect it to the new node
    const updatedEdges = edges.map(edge => 
      edge.target === 'node-end' 
        ? { ...edge, target: newNodeId, id: `e-${edge.source}-${newNodeId}` } 
        : edge
    );

    // Create the final bridge from the New Node to the End Node
    updatedEdges.push({
      id: `e-${newNodeId}-node-end`,
      source: newNodeId,
      target: 'node-end',
      animated: true,
      type: 'code',
      data: { code: '', func_name: `fn_${Math.random().toString(36).slice(2, 7)}` }
    });

    set({ nodes: updatedNodes, edges: updatedEdges });
  },

  updateNodeData: (nodeId, newData) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      ),
    });
  },

  updateEdgeData: (edgeId, data) => {
    set({
      edges: get().edges.map((edge) => 
        edge.id === edgeId ? { ...edge, data: { ...edge.data, ...data } } : edge
      ),
    });
  },

  setPipeline: (id, uuid, nodes, edges, name) => {
    set({ id, uuid, nodes, edges, name });
  },

  // Inside your usePipelineStore...
deleteNodes: (nodesToDelete: Node[]) => {
  set((state) => ({
    nodes: state.nodes.filter((node) => {
      // Prevent deletion of Start and End nodes
      const isProtected = node.type === 'startNode' || node.type === 'endNode';
      // Only keep the node if it's protected OR not in the delete list
      return isProtected || !nodesToDelete.some((n) => n.id === node.id);
    }),
    // Also cleanup edges connected to deleted nodes
    edges: state.edges.filter(
      (edge) =>
        !nodesToDelete.some((n) => n.id === edge.source || n.id === edge.target)
    ),
  }));
},

// Inside PipelineState interface


// Inside create<PipelineState> implementation
updateNodePosition: (nodeId, position) => {
  set((state) => ({
    nodes: state.nodes.map((node) =>
      node.id === nodeId ? { ...node, position } : node
    ),
  }));
},
}));