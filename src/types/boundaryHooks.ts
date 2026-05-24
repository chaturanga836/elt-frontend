export type HookWhen = 'success' | 'always' | 'failure';

export interface BoundaryHookConfig {
  hook_task_id?: number | null;
  hook_when?: HookWhen;
  label?: string;
  /** Task-node sync settings — see types/syncConfig.ts */
  sync?: import('./syncConfig').NodeSyncConfig;
}

export const HOOK_WHEN_OPTIONS: { label: string; value: HookWhen }[] = [
  { label: 'On success only', value: 'success' },
  { label: 'Always', value: 'always' },
  { label: 'On failure only', value: 'failure' },
];

export function buildBoundaryNodeConfig(
  data: Record<string, unknown>,
  isEnd: boolean,
): BoundaryHookConfig {
  const existing = (data.node_config as BoundaryHookConfig) || {};
  const taskId = (data.task_id as number) || existing.hook_task_id;
  const config = data.config as { id?: number; name?: string } | undefined;

  return {
    ...existing,
    hook_task_id: taskId ?? null,
    label: config?.name || existing.label || (data.label as string),
    ...(isEnd ? { hook_when: existing.hook_when || 'success' } : {}),
  };
}
