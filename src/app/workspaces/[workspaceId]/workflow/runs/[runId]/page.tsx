'use client';

import { useParams } from 'next/navigation';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';
import WorkflowRunDetailView from '../../components/WorkflowRunDetailView';

export default function WorkflowRunPage() {
  const workspaceId = useWorkspaceId();
  const params = useParams();
  const runId = Number(params?.runId);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href={workspacePath(workspaceId, 'workflow')}>
        <Button type="link" icon={<ArrowLeftOutlined />} style={{ marginBottom: 8, paddingLeft: 0 }}>
          Back to workflows
        </Button>
      </Link>
      <WorkflowRunDetailView runId={runId} />
    </div>
  );
}
