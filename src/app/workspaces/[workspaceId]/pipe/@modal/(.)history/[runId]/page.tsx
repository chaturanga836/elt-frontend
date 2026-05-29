'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Drawer, Button } from 'antd';
import { ExpandOutlined } from '@ant-design/icons';
import RunDetailView from '../../../components/RunDetailView';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';

export default function PipelineRunDetailDrawerPage() {
    const workspaceId = useWorkspaceId();
    const router = useRouter();
    const params = useParams();
    const runId = Number(params.runId);
    const runIdParam = params.runId as string;

    const handleClose = () => {
        router.back();
    };

    return (
        <Drawer
            title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
                    <span>{Number.isFinite(runId) ? `Run #${runId}` : 'Execution details'}</span>
                    <Button
                        type="link"
                        icon={<ExpandOutlined />}
                        size="small"
                        href={workspacePath(workspaceId, `pipe/history/${runIdParam}`)}
                        onClick={(e) => {
                            e.preventDefault();
                            window.location.assign(workspacePath(workspaceId, `pipe/history/${runIdParam}`));
                        }}
                    >
                        Full page
                    </Button>
                </div>
            }
            open
            onClose={handleClose}
            width={720}
            destroyOnClose
        >
            <RunDetailView runId={runId} />
        </Drawer>
    );
}
