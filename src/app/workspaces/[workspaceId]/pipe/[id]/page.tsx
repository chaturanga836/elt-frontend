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
        const response = await PipelineService.getPipeline(id as string);
        const { pipeline } = response;
        const pipe_id = pipeline.id;
        const uuid = pipeline.pipeline_uuid;

        const canvas = pipeline.canvas_structure || {};
        const initialNodes = canvas.nodes || [];
        const initialEdges = canvas.edges || [];

        setPipeline(pipe_id, uuid, initialNodes, initialEdges, pipeline.name);
        setId(pipe_id);

      } catch (error) {
        console.error("Hydration Error:", error);
      }
    };

    hydrateCanvas();
  }, [id, setPipeline]);

  return (
    <React.Fragment>

      <PipelineCanvas />
    </React.Fragment>);
}