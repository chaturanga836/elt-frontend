// app/pipe/layout.tsx
import React from 'react';

export default function PipeLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="pipeline-system-wrapper">
      {children}
      {modal}
    </div>
  );
}