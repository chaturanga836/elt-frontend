'use client';

import WorkflowNodeShell from './WorkflowNodeShell';

export default function WfEndNode() {
  return (
    <WorkflowNodeShell title="End" color="#ff4d4f" source={false}>
      <span style={{ color: '#666' }}>Workflow exit</span>
    </WorkflowNodeShell>
  );
}
