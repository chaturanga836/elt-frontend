'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReactFlow } from '@xyflow/react';
import { usePipelineStore } from '@/store/usePipeStore';
import { PipelineService } from '@/services/pipe.service';
import { buildPipelineSavePayload } from '@/lib/pipelineSavePayload';
import { workspacePath } from '@/lib/paths';

const DRAFT_DEBOUNCE_MS = 1200;

export function usePipelineDraftAutosave(options: {
  workspaceId: number;
  routePipelineUuid: string | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const { getViewport } = useReactFlow();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const skipAutosaveRef = useRef(true);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    skipAutosaveRef.current = true;
  }, [options.routePipelineUuid]);

  const persistDraftRef = useRef<() => Promise<void>>(async () => {});
  persistDraftRef.current = async () => {
    const opts = optionsRef.current;
    if (!opts.enabled || savingRef.current) {
      queuedRef.current = true;
      return;
    }

    savingRef.current = true;
    usePipelineStore.getState().setDraftSaveStatus('saving');

    const state = usePipelineStore.getState();
    const payload = buildPipelineSavePayload({
      nodes: state.nodes,
      edges: state.edges,
      name: state.name,
      workspaceId: opts.workspaceId,
      pipelineId: state.id,
      pipelineUuid: state.uuid,
      routePipelineUuid: opts.routePipelineUuid,
      viewport: getViewport(),
      isDraft: true,
      pipelineGlobals: state.pipelineGlobals,
    });

    try {
      if (state.id) {
        await PipelineService.UpdatePipeline(state.id, payload);
      } else {
        const data = await PipelineService.savePipeline(payload);
        usePipelineStore.getState().setId(data.pipeline_id);
        if (!opts.routePipelineUuid) {
          router.replace(workspacePath(opts.workspaceId, `pipe/${payload.pipeline_uuid}`));
        }
      }
      usePipelineStore.getState().setUuid(payload.pipeline_uuid);
      usePipelineStore.getState().setIsDraft(true);
      usePipelineStore.getState().setDraftSaveStatus('saved');
    } catch (err) {
      console.error('Draft save failed', err);
      usePipelineStore.getState().setDraftSaveStatus('error');
    } finally {
      savingRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        void persistDraftRef.current();
      }
    }
  };

  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const name = usePipelineStore((s) => s.name);
  const pipelineGlobals = usePipelineStore((s) => s.pipelineGlobals);

  useEffect(() => {
    if (!options.enabled) return;

    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }

    usePipelineStore.getState().setDraftSaveStatus('pending');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      void persistDraftRef.current();
    }, DRAFT_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [nodes, edges, name, pipelineGlobals, options.enabled]);
}
