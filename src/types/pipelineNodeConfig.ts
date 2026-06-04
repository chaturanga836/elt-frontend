import { buildBoundaryNodeConfig } from './boundaryHooks';

/** Coerce React Flow / JSON values to a pipeline task_id (or null). */
export function coerceOptionalTaskId(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}

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
    const boundary = { ...buildBoundaryNodeConfig(data, nodeType === 2) };
    if (nodeType === 0) {
      const existing = (data.node_config as Record<string, unknown>) || {};
      if (existing.start_input !== undefined) {
        boundary.start_input = existing.start_input;
      }
    }
    return boundary;
  }
  const existing = (data.node_config as Record<string, unknown>) || {};
  return { ...existing };
}
