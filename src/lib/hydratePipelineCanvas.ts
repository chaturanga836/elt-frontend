import type { Node } from '@xyflow/react';
import type { TaskResponse } from '@/services/task.service';

export type PipelineApiNode = {
  node_uuid: string;
  node_type?: number;
  node_config?: Record<string, unknown>;
  task_id?: number | null;
};

/** Merge persisted pipe-node rows into React Flow canvas nodes for edit mode. */
export function mergePipelineCanvasNodes(
  canvasNodes: Node[],
  apiNodes: PipelineApiNode[],
  taskById?: Map<number, TaskResponse>,
): Node[] {
  const apiByUuid = Object.fromEntries(apiNodes.map((n) => [n.node_uuid, n]));

  return canvasNodes.map((node) => {
    const api = apiByUuid[node.id];
    if (!api) return node;

    const nodeConfig =
      (api.node_config as Record<string, unknown> | undefined) ??
      (node.data?.node_config as Record<string, unknown> | undefined);
    const taskId =
      api.task_id ??
      (node.data?.task_id as number | null | undefined) ??
      (nodeConfig?.hook_task_id as number | undefined);

    const mergedData: Record<string, unknown> = {
      ...node.data,
      node_config: nodeConfig ?? node.data?.node_config,
      task_id: taskId ?? node.data?.task_id,
    };

    if (node.type === 'restNode') {
      const restConnectionId =
        (nodeConfig?.rest_connection_id as number | undefined) ??
        (node.data?.rest_connection_id as number | undefined);
      if (restConnectionId != null) {
        mergedData.rest_connection_id = restConnectionId;
      }
      if (nodeConfig?.label || node.data?.label) {
        mergedData.label = nodeConfig?.label ?? node.data?.label;
      }
    }

    if (node.type === 'dbNode') {
      const connectionId =
        (nodeConfig?.connection_id as number | undefined) ??
        (node.data?.connection_id as number | undefined);
      if (connectionId != null) {
        mergedData.connection_id = connectionId;
      }
      if (nodeConfig?.label || node.data?.label) {
        mergedData.label = nodeConfig?.label ?? node.data?.label;
      }
    }

    if (node.type === 'taskNode' && taskId && taskById?.has(taskId)) {
      mergedData.config = taskById.get(taskId);
    }

    if ((node.type === 'startNode' || node.type === 'endNode') && taskId) {
      mergedData.task_id = taskId;
    }

    return { ...node, data: mergedData };
  });
}
