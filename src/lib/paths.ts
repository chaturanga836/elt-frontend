export function workspacePath(workspaceId: number, segment = ''): string {
  const base = `/workspaces/${workspaceId}`;
  if (!segment) return base;
  const path = segment.startsWith('/') ? segment : `/${segment}`;
  return `${base}${path}`;
}

/** Maps legacy absolute paths (/pipe, /connections/…) into workspace-scoped URLs. */
export function resolveWorkspacePath(workspaceId: number, path: string): string {
  if (path.startsWith(`/workspaces/${workspaceId}`)) return path;
  if (path.startsWith('/workspaces/')) return path;
  return workspacePath(workspaceId, path.replace(/^\//, ''));
}
