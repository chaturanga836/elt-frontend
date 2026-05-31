'use client';

import React, { useEffect } from 'react';
import PipelineCanvas from '../components/PipelineCanvas';
import { usePipelineStore } from '@/store/usePipeStore';

export default function NewPipelinePage() {
  const resetPipeline = usePipelineStore((state) => state.resetPipeline);

  useEffect(() => {
    resetPipeline();
  }, [resetPipeline]);

  return <PipelineCanvas />;
}