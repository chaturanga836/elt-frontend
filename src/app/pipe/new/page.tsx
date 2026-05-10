'use client';

import React, { useEffect, useState } from 'react';
import PipelineCanvas from '../components/PipelineCanvas';
import { usePipelineStore } from '@/store/usePipeStore';
import { ReactFlowProvider } from '@xyflow/react';

export default function Home() {

      const { setPipeline } = usePipelineStore();
      
    useEffect(() => {
      setPipeline(null, null, [], [], null);
    }, [])
    
  return (
    <ReactFlowProvider>
      <PipelineCanvas />
    </ReactFlowProvider>  );
}