'use client';

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';
import type { Edge } from '@xyflow/react';
import { Spin } from 'antd';
import PipelineCanvas from '../components/PipelineCanvas';
import { usePipelineStore } from '@/store/usePipeStore';
import { PipelineService } from '@/services/pipe.service';
import { TaskService } from '@/services/task.service';
import { mergePipelineCanvasNodes, applyPipelineNodeDeletePolicy } from '@/lib/hydratePipelineCanvas';


export default function Home() {

  const params = useParams();
  const id = params.id;
  const { setPipeline, setId } = usePipelineStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrateCanvas = async () => {
      if (!id || id === 'new') {
        setLoading(false);
        return;
      }

      const resetPipeline = usePipelineStore.getState().resetPipeline;
      resetPipeline();

      try {
        const res = await PipelineService.getPipeline(id as string);
        const pipeline = res.pipeline;
        const apiNodes = res.nodes || [];
        const pipeId = pipeline.id;
        const uuid = pipeline.pipeline_uuid;
        const canvas = pipeline.canvas_structure;
        const canvasNodes = canvas?.nodes ?? [];
        const initialEdges: Edge[] = canvas?.edges ?? [];

        const taskIds = [
          ...new Set(
            apiNodes
              .filter((n) => n.node_type === 1 && n.task_id)
              .map((n) => n.task_id as number),
          ),
        ];
        const tasks = await Promise.all(
          taskIds.map((taskId) => TaskService.getTask(taskId).catch(() => null)),
        );
        const taskById = new Map(
          tasks.filter((t) => t != null).map((t) => [t!.id, t!]),
        );

        const initialNodes = applyPipelineNodeDeletePolicy(
          mergePipelineCanvasNodes(canvasNodes, apiNodes, taskById),
        );

        setPipeline(
          pipeId,
          uuid,
          initialNodes,
          initialEdges,
          pipeline.name,
          pipeline.is_draft !== false,
        );
        setId(pipeId);
      } catch (error) {
        console.error('Hydration Error:', error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    void hydrateCanvas();
  }, [id, setPipeline, setId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <React.Fragment>

      <PipelineCanvas />
    </React.Fragment>);
}