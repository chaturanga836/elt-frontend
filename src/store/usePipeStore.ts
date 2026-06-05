import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { rebuildChainEdges } from '@/lib/pipelineChain';

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

// Fixed core boundaries with custom uuid tracking injected
const startNodeId = `start_${uuidv4().substring(0, 8)}`;
const endNodeId = `end_${uuidv4().substring(0, 8)}`;

const DEFAULT_NODES: Node[] = [
  { 
    id: startNodeId, 
    type: 'startNode', // 0 = startNode
    position: { x: 0, y: 200 }, 
    deletable: false,
    data: { label: 'Start', id: undefined, node_uuid: 'start', config: null, } 
  },
  { 
    id: endNodeId, 
    type: 'endNode', // 2 = endNode
    position: { x: 600, y: 200 }, 
    deletable: false, 
    data: { label: 'End', id: undefined, node_uuid: 'end', config: null } 
  }
];

// Reverted to clean, non-custom visual connections
const INITIAL_EDGES: Edge[] = [
  { 
    id: 'e-start-end', 
    source: startNodeId, 
    target: endNodeId, 
    animated: true,
    style: { strokeWidth: 2 }
  }
];

export const usePipelineStore = create<PipelineState>((set, get) => ({
  // --- Initial State ---
  nodes: DEFAULT_NODES,
  edges: INITIAL_EDGES,
  name: null,
  uuid: null,
  id: null,

  resetPipeline: () => set({ 
    nodes: DEFAULT_NODES, 
    edges: INITIAL_EDGES, 
    name: null,
    id: null,
    uuid: null
  }),

  // --- Getters & Setters ---
  getCurrentUuid: () => get().uuid,
  setUuid: (uuid) => set({ uuid }),
  setId: (id) => set({ id }),
  getId: () => get().id,
  setName: (name) => set({ name }),

  // Logic to add a single node via drop/drag
  addNode: (newNode) => set((state) => {
    // Intercept node to guarantee a fresh uuid is attached to its metadata payload
    const uuid = uuidv4();
    const preparedNode = {
      ...newNode,
      data: {
        ...newNode.data,
        node_uuid: newNode.data?.node_uuid || `task_${uuid}`
      }
    };
    return { nodes: [...state.nodes, preparedNode] };
  }),

  // --- React Flow Handlers ---
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: () => {
    // Linear pipelines: order is left → right; rebuild instead of branching edges.
    set({ edges: rebuildChainEdges(get().nodes) });
  },

  // --- Core API Data Synchronization Setters ---
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  getNodes: () => get().nodes,
  getEdges: () => get().edges,

  // Programmatic Node Appender Hook
  addNodeBetween: (type = '1') => {
    const { nodes, edges } = get();
    // FIXED: Corrected reference from 'node-end' to 'end' to align with initialization
    const endNode = nodes.find(n => n.id === 'end');
    if (!endNode) return;

    const currentEndX = endNode.position.x;
    const trackingUuid = uuidv4();
    const newNodeId = `task_${trackingUuid}`;

    const newNode: Node = {
      id: newNodeId,
      type: type, // Default fallback points to type '1' (execution task)
      position: { x: currentEndX, y: 200 }, 
      data: { 
        label: 'New Task', 
        node_uuid: newNodeId,
        config: {
          name: 'New Task',
          script: '# Write your python logic here\n\ndef main(input_data):\n    return input_data',
          status: 1
        }
      },
    };

    // Shift End Node position to accommodate the layout growth
    const updatedNodes = nodes.map(n => 
      n.id === 'end' 
        ? { ...n, position: { x: n.position.x + GRID_SIZE_X, y: 200 } } 
        : n
    ).concat(newNode);

    // Redirect existing pipeline endpoint markers towards our new task block
    const updatedEdges = edges.map(edge => 
      edge.target === 'end' 
        ? { ...edge, target: newNodeId, id: `e-${edge.source}-${newNodeId}` } 
        : edge
    );

    // Add final link to close the chain
    updatedEdges.push({
      id: `e-${newNodeId}-end`,
      source: newNodeId,
      target: 'end',
      animated: true,
      style: { strokeWidth: 2 }
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

  setPipeline: (id, uuid, nodes, _edges, name) => {
    set({ id, uuid, nodes, edges: rebuildChainEdges(nodes), name });
  },

  deleteNodes: (nodesToDelete: Node[]) => {
    const nodes = get().nodes.filter((node) => {
      const isProtected =
        node.type === '0' ||
        node.type === '2' ||
        node.type === 'startNode' ||
        node.type === 'endNode' ||
        node.id === 'start' ||
        node.id === 'end';
      return isProtected || !nodesToDelete.some((n) => n.id === node.id);
    });
    set({ nodes, edges: rebuildChainEdges(nodes) });
  },

  updateNodePosition: (nodeId, position) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, position } : node
      ),
    }));
  },
}));