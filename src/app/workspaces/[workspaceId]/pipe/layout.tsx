'use client';

import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';

export default function PipeLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <ReactFlowProvider>
      <div className="pipeline-system-wrapper">
        {children}
        {modal}
      </div>
    </ReactFlowProvider>
  );
}