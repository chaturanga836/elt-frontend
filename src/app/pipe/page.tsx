'use client';

import React, { useState } from 'react';
import PipelineCanvas from './components/PipelineCanvas';

export default function Home() {

  return (
    <React.Fragment>
      <h1>Pipe Page</h1>
      <PipelineCanvas />
    </React.Fragment>  );
}