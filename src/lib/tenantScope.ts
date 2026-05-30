/** Workspace-scoped tenant id — must match backend core.tenant_scope.workspace_tenant_id */
export function workspaceTenantId(workspaceId: number): string {
  return `ws_${workspaceId}`;
}

export function workspaceQuery(workspaceId: number): string {
  return `workspace_id=${workspaceId}`;
}
