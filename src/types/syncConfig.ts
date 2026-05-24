/** Stored on task nodes as node_config.sync — validated by backend schemas/sync_config.py */

export type SyncRunMode = 'snapshot' | 'incremental' | 'full_reload';
export type SyncAdvancePolicy = 'run' | 'page';

export type SyncCursorType =
  | 'timestamp_iso'
  | 'timestamp_unix_ms'
  | 'sequence_id'
  | 'opaque_page_token'
  | 'server_flag'
  | 'snapshot_date'
  | 'file_offset'
  | 'none'
  | 'composite';

export interface SyncConnectionRef {
  rest_group_id?: number;
  rest_connection_id?: number;
  template_key?: string;
  provider_key?: string;
}

export interface SyncAdvancedConfig {
  cursor_type?: SyncCursorType;
  cursor_config?: Record<string, unknown>;
  overlap_seconds?: number;
  request_param?: string;
  advance_policy?: SyncAdvancePolicy;
}

export interface NodeSyncConfig {
  enabled: boolean;
  run_mode: SyncRunMode;
  connection_ref?: SyncConnectionRef;
  checkpoint_key?: string;
  advanced?: SyncAdvancedConfig;
}

export const SYNC_RUN_MODE_OPTIONS: { label: string; value: SyncRunMode; description: string }[] = [
  {
    label: 'Snapshot',
    value: 'snapshot',
    description: 'Full point-in-time read (e.g. end-of-day balance)',
  },
  {
    label: 'Incremental',
    value: 'incremental',
    description: 'Continue from last successful checkpoint',
  },
  {
    label: 'Full reload',
    value: 'full_reload',
    description: 'Ignore checkpoint and reload all data',
  },
];

export function defaultNodeSyncConfig(): NodeSyncConfig {
  return { enabled: false, run_mode: 'snapshot' };
}

export function parseNodeSync(nodeConfig?: Record<string, unknown>): NodeSyncConfig | null {
  const raw = nodeConfig?.sync;
  if (!raw || typeof raw !== 'object') return null;
  return raw as NodeSyncConfig;
}
