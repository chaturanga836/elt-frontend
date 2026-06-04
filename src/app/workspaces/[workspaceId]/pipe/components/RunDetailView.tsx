'use client';

import React, { useEffect, useState } from 'react';
import {
    Table,
    Typography,
    Space,
    Descriptions,
    Collapse,
    Spin,
    Alert,
} from 'antd';
import dayjs from 'dayjs';
import {
    PipelineService,
    PipelineRunDetail,
    PipelineNodeLog,
} from '@/services/pipe.service';
import { statusTag } from './runDetailUtils';
import RunReportPanel from '@/features/reports/components/RunReportPanel';
import RunPayloadJsonBlock from './RunPayloadJsonBlock';

const { Title, Text, Paragraph } = Typography;

interface RunDetailViewProps {
    runId: number;
}

export default function RunDetailView({ runId }: RunDetailViewProps) {
    const [loading, setLoading] = useState(true);
    const [runDetail, setRunDetail] = useState<PipelineRunDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!Number.isFinite(runId) || runId <= 0) {
            setError('Invalid run ID');
            setLoading(false);
            return;
        }

        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);
            setRunDetail(null);
            try {
                const detail = await PipelineService.getPipelineRunDetail(runId);
                if (!cancelled) {
                    setRunDetail(detail);
                }
            } catch (err) {
                console.error('Failed to load run detail', err);
                if (!cancelled) {
                    setError('Failed to load execution details.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [runId]);

    if (loading) {
        return <Spin tip="Loading execution details…" />;
    }

    if (error) {
        return <Alert type="error" message={error} showIcon />;
    }

    if (!runDetail) {
        return <Alert type="warning" message="Run not found." showIcon />;
    }

    const nodeLogColumns = [
        {
            title: 'Step',
            dataIndex: 'step_index',
            key: 'step_index',
            width: 60,
        },
        {
            title: 'Node',
            dataIndex: 'node_name',
            key: 'node_name',
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (s: number) => statusTag(s),
        },
        {
            title: 'Time (ms)',
            dataIndex: 'execution_time_ms',
            key: 'execution_time_ms',
            width: 90,
            render: (ms: number | null) => (ms != null ? ms : '—'),
        },
    ];

    const collapseItems = (runDetail.node_logs ?? []).map((log: PipelineNodeLog) => ({
        key: String(log.id),
        label: (
            <Space>
                <Text strong>Step {log.step_index}</Text>
                <Text>{log.node_name}</Text>
                {statusTag(log.status)}
                {log.execution_time_ms != null && (
                    <Text type="secondary">{log.execution_time_ms} ms</Text>
                )}
            </Space>
        ),
        children: (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                    <Text strong>Node UUID:</Text> <Text code>{log.node_uuid}</Text>
                </div>
                {log.stdout_logs ? (
                    <RunPayloadJsonBlock
                        label="Stdout"
                        data={log.stdout_logs}
                        language="plaintext"
                        inlineMaxHeight={200}
                        emptyText="(empty)"
                    />
                ) : null}
                <RunPayloadJsonBlock label="Input" data={log.input_data} />
                <RunPayloadJsonBlock label="Output" data={log.output_data} />
                {log.error_traceback ? (
                    <RunPayloadJsonBlock
                        label="Error"
                        data={log.error_traceback}
                        language="plaintext"
                        inlineMaxHeight={280}
                    />
                ) : null}
            </Space>
        ),
    }));

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Run ID">{runDetail.run.id}</Descriptions.Item>
                <Descriptions.Item label="Pipeline">
                    {runDetail.run.pipeline_name?.trim() || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                    {statusTag(runDetail.run.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Started">
                    {dayjs(runDetail.run.started_at).format('YYYY-MM-DD HH:mm:ss')} UTC
                </Descriptions.Item>
                <Descriptions.Item label="Finished">
                    {runDetail.run.finished_at
                        ? dayjs(runDetail.run.finished_at).format('YYYY-MM-DD HH:mm:ss') + ' UTC'
                        : '—'}
                </Descriptions.Item>
                {runDetail.run.error_summary && (
                    <Descriptions.Item label="Error summary">
                        <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                            {runDetail.run.error_summary}
                        </Paragraph>
                    </Descriptions.Item>
                )}
            </Descriptions>

            <RunReportPanel
                runId={runDetail.run.id}
                pipelineUuid={runDetail.run.pipeline_uuid}
            />

            <div>
                <Title level={5} style={{ marginBottom: 12 }}>Node execution</Title>
                {runDetail.node_logs.length === 0 ? (
                    <Text type="secondary">
                        No node logs yet. The run may still be initializing, or no steps completed.
                    </Text>
                ) : (
                    <>
                        <Table
                            columns={nodeLogColumns}
                            dataSource={runDetail.node_logs}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            style={{ marginBottom: 16 }}
                        />
                        <Collapse items={collapseItems} />
                    </>
                )}
            </div>
        </Space>
    );
}
