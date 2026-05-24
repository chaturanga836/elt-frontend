import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  name: string;
  description: string;
  id: number | null;
  uuid: string | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setName: (name: string) => void;
  setDescription: (desc: string) => void;
  setId: (id: number | null) => void;
  setUuid: (uuid: string | null) => void;
  getId: () => number | null;
  getNodes: () => Node[];
  getEdges: () => Edge[];
  addNode: (node: Node) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  deleteNodes: (nodes: Node[]) => void;
  setWorkflow: (
    id: number | null,
    uuid: string | null,
    nodes: Node[],
    edges: Edge[],
    name: string,
    description?: string,
  ) => void;
  resetWorkflow: () => void;
}

const startId = `wf_start_${uuidv4().slice(0, 8)}`;
const endId = `wf_end_${uuidv4().slice(0, 8)}`;

const DEFAULT_NODES: Node[] = [
  {
    id: startId,
    type: 'startNode',
    position: { x: 80, y: 220 },
    deletable: false,
    data: { label: 'Start', node_config: {}, config: null },
  },
  {
    id: endId,
    type: 'endNode',
    position: { x: 900, y: 220 },
    deletable: false,
    data: { label: 'End', node_config: { hook_when: 'success' }, config: null },
  },
];

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: DEFAULT_NODES,
  edges: [],
  name: 'Untitled Workflow',
  description: '',
  id: null,
  uuid: null,

  resetWorkflow: () =>
    set({
      nodes: DEFAULT_NODES,
      edges: [],
      name: 'Untitled Workflow',
      description: '',
      id: null,
      uuid: null,
    }),

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => {
    const handle = connection.sourceHandle || 'default';
    set({
      edges: addEdge(
        {
          ...connection,
          id: `e-${connection.source}-${handle}-${connection.target}`,
          animated: true,
          label: handle === 'true' ? 'Yes' : handle === 'false' ? 'No' : undefined,
          data: { branch: handle },
        },
        get().edges,
      ),
    });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),
  setId: (id) => set({ id }),
  setUuid: (uuid) => set({ uuid }),
  getId: () => get().id,
  getNodes: () => get().nodes,
  getEdges: () => get().edges,

  addNode: (node) => set({ nodes: [...get().nodes, node] }),

  updateNodeData: (nodeId, data) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      ),
    }),

  deleteNodes: (toDelete) =>
    set({
      nodes: get().nodes.filter(
        (n) =>
          n.type === 'startNode' ||
          n.type === 'endNode' ||
          !toDelete.some((d) => d.id === n.id),
      ),
      edges: get().edges.filter(
        (e) => !toDelete.some((d) => d.id === e.source || d.id === e.target),
      ),
    }),

  setWorkflow: (id, uuid, nodes, edges, name, description = '') =>
    set({ id, uuid, nodes, edges, name, description }),
}));
