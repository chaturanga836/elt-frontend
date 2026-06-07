import { v4 as uuidv4 } from 'uuid';
import type { Node, Viewport } from '@xyflow/react';
import type { Edge } from '@xyflow/react';
import { buildPipelineNodeConfig, coerceOptionalTaskId } from '@/types/pipelineNodeConfig';
import type { PipelineCreatePayload, PipelineTask } from '@/types/pipetypes';
import { orderNodesFromEdges } from '@/lib/pipelineChain';
import { PIPELINE_NAME_PLACEHOLDER } from '@/lib/validatePipelineName';

function mapNodeTypeToInt(typeString: string | undefined): 0 | 1 | 2 | 3 | 4 {
  if (typeString === 'startNode') return 0;
  if (typeString === 'taskNode') return 1;
  if (typeString === 'endNode') return 2;
  if (typeString === 'restNode') return 3;
  if (typeString === 'dbNode') return 4;
  return 1;
}

export function buildPipelineSavePayload(options: {
  nodes: Node[];
  edges: Edge[];
  name: string | null;
  workspaceId: number;
  pipelineId: number | null;
  pipelineUuid: string | null;
  routePipelineUuid: string | null;
  viewport: Viewport;
  isDraft: boolean;
}): PipelineCreatePayload {
  const {
    nodes,
    edges,
    name,
    workspaceId,
    pipelineId,
    pipelineUuid,
    routePipelineUuid,
    viewport,
    isDraft,
  } = options;

  const targetUuid = pipelineUuid || routePipelineUuid || uuidv4();
  const trimmedName = (name || '').trim() || PIPELINE_NAME_PLACEHOLDER;
  const orderedNodes = orderNodesFromEdges(nodes, edges);

  return {
    ...(pipelineId ? { id: pipelineId } : {}),
    pipeline_uuid: targetUuid,
    name: trimmedName,
    org_id: 1,
    workspace_id: workspaceId,
    is_draft: isDraft,
    canvas_structure: {
      nodes,
      edges,
      viewport,
    },
    tasks: orderedNodes.map((node, index): PipelineTask => {
      const leftParentId = index > 0 ? orderedNodes[index - 1].id : null;
      const rightParentId =
        index < orderedNodes.length - 1 ? orderedNodes[index + 1].id : null;

      const nodeType = mapNodeTypeToInt(node.type);
      const isBoundary = nodeType === 0 || nodeType === 2;
      const nodeConfig = buildPipelineNodeConfig(
        node.data as Record<string, unknown>,
        nodeType,
      );

      const nodeData = node.data as Record<string, unknown>;
      const config = nodeData.config as { name?: string } | undefined;
      const label =
        config?.name ||
        (nodeData.label as string) ||
        (nodeType === 0 ? 'Start' : nodeType === 2 ? 'End' : 'Task');

      return {
        node_uuid: node.id,
        id: nodeData.id ? Number(nodeData.id) : undefined,
        name: label,
        node_type: nodeType,
        task_id: isBoundary
          ? coerceOptionalTaskId(nodeConfig.hook_task_id)
          : coerceOptionalTaskId(nodeData.task_id),
        node_config: nodeConfig,
        left_depend: leftParentId,
        right_depend: rightParentId,
      };
    }),
  };
}
