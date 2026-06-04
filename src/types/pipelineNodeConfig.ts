import { buildBoundaryNodeConfig } from './boundaryHooks';

/** Build persisted node_config for pipeline save payloads. */
export function buildPipelineNodeConfig(
  data: Record<string, unknown>,
  nodeType: 0 | 1 | 2 | 3,
): Record<string, unknown> {
  if (nodeType === 3) {
    const existing = (data.node_config as Record<string, unknown>) || {};
    const restConnectionId =
      existing.rest_connection_id ?? data.rest_connection_id;
    return {
      ...existing,
      ...(restConnectionId != null ? { rest_connection_id: restConnectionId } : {}),
      label: (existing.label as string) || (data.label as string) || 'REST Endpoint',
    };
  }
  if (nodeType === 0 || nodeType === 2) {
    return buildBoundaryNodeConfig(data, nodeType === 2);
  }
  const existing = (data.node_config as Record<string, unknown>) || {};
  return { ...existing };
}
