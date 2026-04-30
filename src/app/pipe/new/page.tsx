'use client';

import React, { useEffect, useState } from 'react';
import PipelineCanvas from '../components/PipelineCanvas';
import { usePipelineStore } from '@/store/usePipeStore';

export default function Home() {

      const { setPipeline } = usePipelineStore();
      
    useEffect(() => {
      setPipeline(null, null, [], [], null);
    }, [])
    
  return (
    <React.Fragment>
      <PipelineCanvas />
    </React.Fragment>  );
}