'use client';

import React, { useEffect } from 'react';
import PipelineCanvas from '../components/PipelineCanvas';
import { usePipelineStore } from '@/store/usePipeStore';
import { ReactFlowProvider } from '@xyflow/react';

export default function NewPipelinePage() {
  const resetPipeline = usePipelineStore((state) => state.resetPipeline);
      
  useEffect(() => {
    // Reset the store to DEFAULT_NODES when this page mounts
    resetPipeline();
  }, [resetPipeline]); // Use the function as a dependency
    
  return (
    <ReactFlowProvider>
      {/* 
         Wrapping in Provider here is good, 
         but ensure PipelineCanvas itself doesn't 
         have its own Provider that conflicts. 
      */}
      <PipelineCanvas />
    </ReactFlowProvider>
  );
}