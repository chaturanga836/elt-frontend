'use client';

import React, { useState } from 'react';
import PipelineListPage from '../components/PipelineListPage';


export default function Home() {

  return (
    <React.Fragment>
        <h1>Pipeline List</h1>
        <PipelineListPage />
    </React.Fragment>  );
}