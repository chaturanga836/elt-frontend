'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import RunDetailView from '../../components/RunDetailView';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';

const { Title } = Typography;

export default function PipelineRunDetailPage() {
    const workspaceId = useWorkspaceId();
    const params = useParams();
    const router = useRouter();
    const runId = Number(params.runId);

    return (
        <div style={{ padding: '24px' }}>
            <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push(workspacePath(workspaceId, 'pipe/history'))}
                style={{ paddingLeft: 0, marginBottom: 8 }}
            >
                Back to Run History
            </Button>

            <Title level={4} style={{ marginBottom: 20 }}>
                Run #{Number.isFinite(runId) ? runId : params.runId}
            </Title>

            <RunDetailView runId={runId} />
        </div>
    );
}
