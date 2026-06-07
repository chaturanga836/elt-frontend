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
  Connection,
} from '@xyflow/react';
import {
  applyChainConnection,
  insertNodeBeforeTarget,
  removeNodeFromChain,
  resolvePipelineEdges,
} from '@/lib/pipelineChain';
import { applyPipelineNodeDeletePolicy } from '@/lib/hydratePipelineCanvas';

const GRID_SIZE_X = 200;

interface PipelineState {
  nodes: Node[];
  edges: Edge[];
  name: string | null;
  id: number | null;
  uuid: string | null;
  isDraft: boolean;
  draftSaveStatus: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
  getCurrentUuid: () => string | null;
  setUuid: (uuid: string | null) => void;
  setId: (id: number | null) => void;
  getId: () => number | null;
  setName: (name: string | null) => void;
  setIsDraft: (isDraft: boolean) => void;
  setDraftSaveStatus: (status: PipelineState['draftSaveStatus']) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  reconnectChainEdge: (oldEdge: Edge, connection: Connection) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNodeBetween: (type?: string) => void;
  updateNodeData: (nodeId: string, newData: any) => void;
  updateEdgeData: (edgeId: string, data: any) => void;
  setPipeline: (id: number | null, uuid: string | null, nodes: Node[], edges: Edge[], name: string | null, isDraft?: boolean) => void;
  getNodes: () => Node[];
  getEdges: () => Edge[];
  addNode: (newNode: Node) => void;
  deleteNodes: (nodesToDelete: Node[]) => void;
  updateNodePosition: (nodeId: string, position: { x: number, y: number }) => void;
  resetPipeline: () => void;
}

const startNodeId = `start_${uuidv4().substring(0, 8)}`;
const endNodeId = `end_${uuidv4().substring(0, 8)}`;

const DEFAULT_NODES: Node[] = [
  {
    id: startNodeId,
    type: 'startNode',
    position: { x: 0, y: 200 },
    deletable: false,
    data: { label: 'Start', id: undefined, node_uuid: 'start', config: null },
  },
  {
    id: endNodeId,
    type: 'endNode',
    position: { x: 600, y: 200 },
    deletable: false,
    data: { label: 'End', id: undefined, node_uuid: 'end', config: null },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: 'e-start-end',
    source: startNodeId,
    target: endNodeId,
    animated: true,
    style: { strokeWidth: 2 },
  },
];

export const usePipelineStore = create<PipelineState>((set, get) => ({
  nodes: DEFAULT_NODES,
  edges: INITIAL_EDGES,
  name: null,
  uuid: null,
  id: null,
  isDraft: true,
  draftSaveStatus: 'idle',

  resetPipeline: () =>
    set({
      nodes: DEFAULT_NODES,
      edges: INITIAL_EDGES,
      name: null,
      id: null,
      uuid: null,
      isDraft: true,
      draftSaveStatus: 'idle',
    }),

  getCurrentUuid: () => get().uuid,
  setUuid: (uuid) => set({ uuid }),
  setId: (id) => set({ id }),
  getId: () => get().id,
  setName: (name) => set({ name }),
  setIsDraft: (isDraft) => set({ isDraft }),
  setDraftSaveStatus: (draftSaveStatus) => set({ draftSaveStatus }),

  addNode: (newNode) =>
    set((state) => {
      const uuid = uuidv4();
      const preparedNode = {
        ...newNode,
        data: {
          ...newNode.data,
          node_uuid: newNode.data?.node_uuid || `task_${uuid}`,
        },
      };
      return { nodes: [...state.nodes, preparedNode] };
    }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    set({ edges: applyChainConnection(get().edges, connection) });
  },

  reconnectChainEdge: (oldEdge, connection) => {
    const withoutOld = get().edges.filter((edge) => edge.id !== oldEdge.id);
    if (!connection.source || !connection.target) {
      set({ edges: withoutOld });
      return;
    }
    set({ edges: applyChainConnection(withoutOld, connection) });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  getNodes: () => get().nodes,
  getEdges: () => get().edges,

  addNodeBetween: (type = '1') => {
    const { nodes, edges } = get();
    const endNode = nodes.find((n) => n.type === 'endNode');
    if (!endNode) return;

    const trackingUuid = uuidv4();
    const newNodeId = `task_${trackingUuid}`;
    const newNode: Node = {
      id: newNodeId,
      type: type,
      position: { x: endNode.position.x, y: 200 },
      data: {
        label: 'New Task',
        node_uuid: newNodeId,
        config: {
          name: 'New Task',
          script: '# Write your python logic here\n\ndef main(input_data):\n    return input_data',
          status: 1,
        },
      },
    };

    const updatedNodes = nodes
      .map((n) =>
        n.id === endNode.id
          ? { ...n, position: { x: n.position.x + GRID_SIZE_X, y: 200 } }
          : n,
      )
      .concat(newNode);

    set({
      nodes: updatedNodes,
      edges: insertNodeBeforeTarget(edges, newNodeId, endNode.id),
    });
  },

  updateNodeData: (nodeId, newData) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const mergedData: Record<string, unknown> = { ...node.data, ...newData };
        if (newData.node_config != null) {
          mergedData.node_config = {
            ...((node.data?.node_config as Record<string, unknown>) || {}),
            ...(newData.node_config as Record<string, unknown>),
          };
        }
        return { ...node, data: mergedData };
      }),
    });
  },

  updateEdgeData: (edgeId, data) => {
    set({
      edges: get().edges.map((edge) =>
        edge.id === edgeId ? { ...edge, data: { ...edge.data, ...data } } : edge,
      ),
    });
  },

  setPipeline: (id, uuid, nodes, edges, name, isDraft = true) => {
    set({
      id,
      uuid,
      nodes: applyPipelineNodeDeletePolicy(nodes),
      edges: resolvePipelineEdges(nodes, edges),
      name,
      isDraft,
      draftSaveStatus: 'idle',
    });
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

    let edges = get().edges;
    nodesToDelete.forEach((node) => {
      edges = removeNodeFromChain(edges, node.id);
    });

    set({ nodes, edges });
  },

  updateNodePosition: (nodeId, position) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, position } : node,
      ),
    }));
  },
}));
