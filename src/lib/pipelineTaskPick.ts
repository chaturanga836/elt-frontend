import type { TaskResponse } from '@/services/task.service';

const STORAGE_KEY = 'elt.pipelineTaskPick';

export type PipelineTaskPick = {
  nodeId: string;
  task: TaskResponse;
};

export function stashPipelineTaskPick(pick: PipelineTaskPick): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pick));
}

export function consumePipelineTaskPick(nodeId: string): TaskResponse | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PipelineTaskPick;
    if (parsed.nodeId !== nodeId) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    return parsed.task;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
