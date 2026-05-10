import { Node, Edge, Viewport } from '@xyflow/react';

export type TaskType = 'start' | 'task' | 'logic_gate' | 'sink';

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
  id?: number;
  task_key: string;      // The unique ID in React Flow (n1, n3, etc.)
  task_type: TaskType;
  is_start_node: boolean;
  connection_id?: number | null;
  depends_on: string[];  // Array of task_keys
  logic_id?: number | null;
  logic?: PipelineLogic | null; // Hydrated from the backend
  input_mapping?: InputMapping | null;
}

export interface CanvasStructure {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
}

export interface PipelineCreatePayload {
  id?: number;              // Optional: Only present during a PUT (update)
  pipeline_uuid: string;
  name: string;
  org_id: number;
  workspace_id: number;
  canvas_structure: CanvasStructure;
  tasks: PipelineTask[]; 
}

export interface Pipeline extends PipelineCreatePayload {
  id: number;               // Now it's mandatory
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}