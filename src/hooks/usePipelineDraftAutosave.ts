'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReactFlow } from '@xyflow/react';
import { usePipelineStore } from '@/store/usePipeStore';
import { PipelineService } from '@/services/pipe.service';
import { buildPipelineSavePayload } from '@/lib/pipelineSavePayload';
import { workspacePath } from '@/lib/paths';

const DRAFT_DEBOUNCE_MS = 1200;

type DraftSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export function usePipelineDraftAutosave(options: {
  workspaceId: number;
  routePipelineUuid: string | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const { getViewport } = useReactFlow();
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const name = usePipelineStore((s) => s.name);
  const pipelineId = usePipelineStore((s) => s.id);
  const pipelineUuid = usePipelineStore((s) => s.uuid);
  const setId = usePipelineStore((s) => s.setId);
  const setUuid = usePipelineStore((s) => s.setUuid);
  const setIsDraft = usePipelineStore((s) => s.setIsDraft);
  const setDraftSaveStatus = usePipelineStore((s) => s.setDraftSaveStatus);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const skipAutosaveRef = useRef(true);

  useEffect(() => {
    skipAutosaveRef.current = true;
  }, [options.routePipelineUuid]);

  const persistDraft = useCallback(async () => {
    if (!options.enabled || savingRef.current) {
      queuedRef.current = true;
      return;
    }

    savingRef.current = true;
    setDraftSaveStatus('saving');

    const currentId = usePipelineStore.getState().id;
    const currentUuid = usePipelineStore.getState().uuid;
    const payload = buildPipelineSavePayload({
      nodes: usePipelineStore.getState().nodes,
      edges: usePipelineStore.getState().edges,
      name: usePipelineStore.getState().name,
      workspaceId: options.workspaceId,
      pipelineId: currentId,
      pipelineUuid: currentUuid,
      routePipelineUuid: options.routePipelineUuid,
      viewport: getViewport(),
      isDraft: true,
      pipelineGlobals: usePipelineStore.getState().pipelineGlobals,
    });

    try {
      if (currentId) {
        await PipelineService.UpdatePipeline(currentId, payload);
      } else {
        const data = await PipelineService.savePipeline(payload);
        setId(data.pipeline_id);
        if (!options.routePipelineUuid) {
          router.replace(workspacePath(options.workspaceId, `pipe/${payload.pipeline_uuid}`));
        }
      }
      setUuid(payload.pipeline_uuid);
      setIsDraft(true);
      setDraftSaveStatus('saved');
    } catch (err) {
      console.error('Draft save failed', err);
      setDraftSaveStatus('error');
    } finally {
      savingRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        void persistDraft();
      }
    }
  }, [
    getViewport,
    options.enabled,
    options.routePipelineUuid,
    options.workspaceId,
    router,
    setDraftSaveStatus,
    setId,
    setIsDraft,
    setUuid,
  ]);

  useEffect(() => {
    if (!options.enabled) return;

    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }

    setDraftSaveStatus('pending');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      void persistDraft();
    }, DRAFT_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [nodes, edges, name, options.enabled, persistDraft, setDraftSaveStatus]);
}
