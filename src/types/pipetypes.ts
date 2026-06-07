import { Node, Edge, Viewport } from '@xyflow/react';
import { BoundaryHookConfig } from './boundaryHooks';

export type TaskType = 0 | 1 | 2 | 3 | 4;

export interface PipelineLogic {
  id?: number;
  func_name: string;
  transform_code: string;
  code_hash?: string;
}

export interface InputMapping {
  [source_task_key: string]: string; // e.g., { "n1": "source_df" }
}

export interface PipelineTask {
  id?: number | undefined;
  pipeline_id? : number;
  name?: string;
  task_id?: number | null;
  node_type: TaskType;
  node_uuid: string;
  node_config?: BoundaryHookConfig | Record<string, unknown>;
  left_depend ?: string | null;
  right_depend?: string | null;
  // depends_on: string[];  // Array of task_keys
  // logic_id?: number | null;
  // logic?: PipelineLogic | null; // Hydrated from the backend
  // input_mapping?: InputMapping | null;
}

export interface CanvasStructure {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  pipeline_globals?: import('@/lib/pipelineGlobals').PipelineGlobalsConfig;
}

export interface PipelineCreatePayload {
  id?: number;              // Optional: Only present during a PUT (update)
  pipeline_uuid: string;
  name: string;
  org_id?: number;
  workspace_id?: number;
  is_draft?: boolean;
  canvas_structure: CanvasStructure;
  tasks: PipelineTask[]; 
}

export interface Pipeline extends PipelineCreatePayload {
  id: number;               // Now it's mandatory
  version: number;
  is_active: boolean;
  is_draft?: boolean;
  created_at: string;
  updated_at: string;
}