'use client';

import React from 'react';
import { useSelectedLayoutSegment } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { PipeModalProvider } from './PipeModalContext';
import styles from './pipeline-editor.module.css';

export default function PipeLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const modalSegment = useSelectedLayoutSegment('modal');

  return (
    <PipeModalProvider segmentActive={modalSegment != null}>
      <div className={styles.pipeLayout}>
        <ReactFlowProvider>
          <div
            className={modalSegment != null ? styles.pipeLayoutBackground : undefined}
            aria-hidden={modalSegment != null || undefined}
          >
            {children}
          </div>
        </ReactFlowProvider>
        {modal}
      </div>
    </PipeModalProvider>
  );
}