'use client';

import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import styles from './pipeline-editor.module.css';

export default function PipeLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <ReactFlowProvider>
      <div className={styles.pipeLayout}>
        {children}
        {modal}
      </div>
    </ReactFlowProvider>
  );
}