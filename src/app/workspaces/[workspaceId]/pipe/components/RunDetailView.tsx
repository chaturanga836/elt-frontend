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
import { formatJsonBlock, statusTag } from './runDetailUtils';

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
                {log.stdout_logs && (
                    <div>
                        <Text strong>Stdout</Text>
                        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, overflow: 'auto', maxHeight: 200 }}>
                            {log.stdout_logs}
                        </pre>
                    </div>
                )}
                <div>
                    <Text strong>Input</Text>
                    <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, overflow: 'auto', maxHeight: 240 }}>
                        {formatJsonBlock(log.input_data)}
                    </pre>
                </div>
                <div>
                    <Text strong>Output</Text>
                    <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, overflow: 'auto', maxHeight: 240 }}>
                        {formatJsonBlock(log.output_data)}
                    </pre>
                </div>
                {log.error_traceback && (
                    <div>
                        <Text strong type="danger">Error</Text>
                        <pre style={{ background: '#fff1f0', padding: 12, borderRadius: 6, overflow: 'auto', maxHeight: 280 }}>
                            {log.error_traceback}
                        </pre>
                    </div>
                )}
            </Space>
        ),
    }));

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Run ID">{runDetail.run.id}</Descriptions.Item>
                <Descriptions.Item label="Pipeline UUID">
                    {runDetail.run.pipeline_uuid}
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
