export type PipelineRestConnectionSummary = {
  id: number;
  name: string;
  effective_url?: string | null;
  url?: string | null;
  method?: number;
  group_name?: string | null;
};

const STORAGE_KEY = 'elt.pipelineConnectionPick';

export type PipelineConnectionPick = {
  nodeId: string;
  connection: PipelineRestConnectionSummary;
};

export function stashPipelineConnectionPick(pick: PipelineConnectionPick): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pick));
}

export function consumePipelineConnectionPick(
  nodeId: string,
): PipelineRestConnectionSummary | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PipelineConnectionPick;
    if (parsed.nodeId !== nodeId) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    return parsed.connection;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
