/** Account-level organization settings (owners only). */
export function organizationSettingsPath(): string {
  return '/projects/settings';
}

/** Primary BaaS scope path (prototype uses /projects). */
export function projectPath(projectId: number, segment = ''): string {
  const base = `/projects/${projectId}`;
  if (!segment) return base;
  const path = segment.startsWith('/') ? segment : `/${segment}`;
  return `${base}${path}`;
}

/** @deprecated Use projectPath — kept as alias during BaaS transition. */
export function workspacePath(workspaceId: number, segment = ''): string {
  return projectPath(workspaceId, segment);
}

/** Maps legacy absolute paths (/pipe, /connections/…) into project-scoped URLs. */
export function resolveWorkspacePath(workspaceId: number, path: string): string {
  if (path.startsWith(`/projects/${workspaceId}`)) return path;
  if (path.startsWith('/projects/')) return path;
  return projectPath(workspaceId, path.replace(/^\//, ''));
}

export const resolveProjectPath = resolveWorkspacePath;
