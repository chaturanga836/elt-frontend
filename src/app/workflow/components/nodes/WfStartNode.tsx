'use client';

import WorkflowNodeShell from './WorkflowNodeShell';

export default function WfStartNode() {
  return (
    <WorkflowNodeShell title="Start" color="#52c41a" target={false}>
      <span style={{ color: '#666' }}>Workflow entry</span>
    </WorkflowNodeShell>
  );
}
