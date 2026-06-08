import { Edge, Node, Viewport } from '@xyflow/react';
import { BoundaryHookConfig } from './boundaryHooks';

export type WorkflowNodeType =
  | 'startNode'
  | 'endNode'
  | 'taskNode'
  | 'pipelineNode'
  | 'conditionNode'
  | 'parallelForkNode'
  | 'parallelJoinNode';

export type WorkflowNodeTypeInt = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WorkflowNodePayload {
  node_uuid: string;
  node_type: WorkflowNodeTypeInt;
  task_id?: number | null;
  node_config?: BoundaryHookConfig | Record<string, unknown>;
}

export interface WorkflowCanvasStructure {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
}

export interface WorkflowCreatePayload {
  id?: number;
  workflow_uuid: string;
  name: string;
  description?: string;
  org_id?: number;
  workspace_id?: number;
  canvas_structure: WorkflowCanvasStructure;
  nodes: WorkflowNodePayload[];
}

export interface WorkflowListItem {
  id: number;
  workflow_uuid: string;
  name: string;
  description?: string;
  version: number;
  is_active: boolean;
  created_at: string;
}
