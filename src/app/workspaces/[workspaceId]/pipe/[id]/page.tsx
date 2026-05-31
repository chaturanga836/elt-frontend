'use client';

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';
import PipelineCanvas from '../components/PipelineCanvas';
import { usePipelineStore } from '@/store/usePipeStore';
import { PipelineService } from '@/services/pipe.service';


export default function Home() {

  const params = useParams();
  const id = params.id;
  const { setPipeline, setId } = usePipelineStore();

  useEffect(() => {
    const hydrateCanvas = async () => {
      if (!id || id === 'new') return;

      try {
        const pipeline = await PipelineService.getPipeline(id as string);
        const pipeId = pipeline.id;
        const uuid = pipeline.pipeline_uuid;
        const canvas = pipeline.canvas_structure || {};
        const initialNodes = canvas.nodes || [];
        const initialEdges = canvas.edges || [];

        setPipeline(pipeId, uuid, initialNodes, initialEdges, pipeline.name);
        setId(pipeId);
      } catch (error) {
        console.error('Hydration Error:', error);
      }
    };

    void hydrateCanvas();
  }, [id, setPipeline, setId]);

  return (
    <React.Fragment>

      <PipelineCanvas />
    </React.Fragment>);
}