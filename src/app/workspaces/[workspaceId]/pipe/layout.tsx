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
  const modalActive = modalSegment != null;

  return (
    <ReactFlowProvider>
      <PipeModalProvider active={modalActive}>
        <div className={styles.pipeLayout}>
          <div
            className={modalActive ? styles.pipeLayoutBackground : undefined}
            aria-hidden={modalActive || undefined}
          >
            {children}
          </div>
          {modal}
        </div>
      </PipeModalProvider>
    </ReactFlowProvider>
  );
}