import type { Edge, Node, Viewport } from '@xyflow/react';
import type {
  WorkflowCreatePayload,
  WorkflowNodePayload,
  WorkflowNodeTypeInt,
} from '@/types/workflow';
import { buildBoundaryNodeConfig } from '@/types/boundaryHooks';
import { coerceOptionalTaskId } from '@/types/pipelineNodeConfig';

function mapNodeType(typeString: string | undefined): WorkflowNodeTypeInt {
  const map: Record<string, WorkflowNodeTypeInt> = {
    startNode: 0,
    taskNode: 1,
    endNode: 2,
    pipelineNode: 3,
    conditionNode: 4,
    parallelForkNode: 5,
    parallelJoinNode: 6,
  };
  return map[typeString || ''] ?? 1;
}

function buildWorkflowNodeConfig(
  data: Record<string, unknown>,
  nodeType: WorkflowNodeTypeInt,
): Record<string, unknown> {
  if (nodeType === 0 || nodeType === 2) {
    return { ...buildBoundaryNodeConfig(data, nodeType === 2) };
  }
  const existing = (data.node_config as Record<string, unknown>) || {};
  if (nodeType === 1) {
    return {
      ...existing,
      ...(data.label ? { label: data.label } : {}),
    };
  }
  return { ...existing };
}

export function buildWorkflowSavePayload(options: {
  nodes: Node[];
  edges: Edge[];
  name: string;
  description: string;
  workspaceId: number;
  workflowId: number | null;
  workflowUuid: string;
  viewport: Viewport;
}): WorkflowCreatePayload {
  const { nodes, edges, name, description, workspaceId, workflowId, workflowUuid, viewport } =
    options;

  return {
    ...(workflowId ? { id: workflowId } : {}),
    workflow_uuid: workflowUuid,
    name,
    description,
    org_id: 1,
    workspace_id: workspaceId,
    canvas_structure: {
      nodes,
      edges,
      viewport,
    },
    nodes: nodes.map((node): WorkflowNodePayload => {
      const nodeType = mapNodeType(node.type);
      const isBoundary = nodeType === 0 || nodeType === 2;
      const data = (node.data || {}) as Record<string, unknown>;
      const nodeConfig = buildWorkflowNodeConfig(data, nodeType);

      return {
        node_uuid: node.id,
        node_type: nodeType,
        task_id: isBoundary
          ? coerceOptionalTaskId(
              (nodeConfig.hook_task_id as number | undefined) ?? data.task_id,
            )
          : coerceOptionalTaskId(
              data.task_id ?? (data.config as { id?: number } | undefined)?.id,
            ),
        node_config: nodeConfig,
      };
    }),
  };
}
