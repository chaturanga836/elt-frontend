'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Table,
    Typography,
    Space,
    Descriptions,
    Collapse,
    Spin,
    Alert,
    Button,
    Popconfirm,
    message,
    Progress,
} from 'antd';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
    PipelineService,
    PipelineRunDetail,
    PipelineNodeLog,
} from '@/services/pipe.service';
import {
    RUN_STATUS_INITIALIZING,
    RUN_STATUS_SUCCESS,
    canResumePipelineRun,
    statusTag,
} from './runDetailUtils';
import RunReportPanel from '@/features/reports/components/RunReportPanel';
import RunPayloadJsonBlock from './RunPayloadJsonBlock';

const { Title, Text, Paragraph } = Typography;

const POLL_MS = 2500;

interface RunDetailViewProps {
    runId: number;
}

export default function RunDetailView({ runId }: RunDetailViewProps) {
    const [loading, setLoading] = useState(true);
    const [runDetail, setRunDetail] = useState<PipelineRunDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [resuming, setResuming] = useState(false);

    const loadDetail = useCallback(async (opts?: { silent?: boolean }) => {
        if (!Number.isFinite(runId) || runId <= 0) {
            setError('Invalid run ID');
            setLoading(false);
            return null;
        }

        if (!opts?.silent) {
            setLoading(true);
        }
        setError(null);

        try {
            const detail = await PipelineService.getPipelineRunDetail(runId);
            setRunDetail(detail);
            return detail;
        } catch (err) {
            console.error('Failed to load run detail', err);
            if (!opts?.silent) {
                setError('Failed to load execution details.');
            }
            return null;
        } finally {
            if (!opts?.silent) {
                setLoading(false);
            }
        }
    }, [runId]);

    useEffect(() => {
        void loadDetail();
    }, [loadDetail]);

    useEffect(() => {
        if (runDetail?.run.status !== RUN_STATUS_INITIALIZING) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            void loadDetail({ silent: true });
        }, POLL_MS);

        return () => window.clearInterval(timer);
    }, [runDetail?.run.status, loadDetail]);

    const handleResume = async () => {
        setResuming(true);
        try {
            const res = await PipelineService.resumePipelineRun(runId);
            message.success(`Resuming from step ${res.resume_from_step}`);
            await loadDetail({ silent: true });
        } catch (err) {
            console.error('Resume failed', err);
            message.error('Failed to resume run. Check that the run failed with a saved checkpoint.');
        } finally {
            setResuming(false);
        }
    };

    if (loading && !runDetail) {
        return <Spin tip="Loading execution details…" />;
    }

    if (error && !runDetail) {
        return <Alert type="error" message={error} showIcon />;
    }

    if (!runDetail) {
        return <Alert type="warning" message="Run not found." showIcon />;
    }

    const { run } = runDetail;
    const ctx = run.run_context;
    const totalSteps = ctx?.total_steps;
    const stepIndex = run.current_step_index;
    const showProgress =
        totalSteps != null
        && totalSteps > 0
        && stepIndex != null
        && run.status !== RUN_STATUS_SUCCESS;
    const progressPercent =
        showProgress && totalSteps
            ? Math.min(100, Math.round((stepIndex / totalSteps) * 100))
            : undefined;
    const resumeAllowed = canResumePipelineRun(
        run.status,
        run.current_step_index,
        run.can_resume,
    );

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

    const contextCollapseItems = [
        ...(run.input_payload != null
            ? [{
                key: 'input',
                label: 'Run input',
                children: <RunPayloadJsonBlock label="input_payload" data={run.input_payload} />,
            }]
            : []),
        ...(ctx?.payload !== undefined
            ? [{
                key: 'checkpoint-payload',
                label: 'Checkpoint payload',
                children: <RunPayloadJsonBlock label="payload" data={ctx.payload} />,
            }]
            : []),
        ...(ctx?.globals && Object.keys(ctx.globals).length > 0
            ? [{
                key: 'checkpoint-globals',
                label: 'Checkpoint globals',
                children: <RunPayloadJsonBlock label="globals" data={ctx.globals} />,
            }]
            : []),
    ];

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Space wrap>
                {resumeAllowed ? (
                    <Popconfirm
                        title="Resume from last checkpoint?"
                        description={
                            stepIndex != null
                                ? `Execution will continue from step ${stepIndex}.`
                                : 'Execution will continue from the saved checkpoint.'
                        }
                        onConfirm={() => void handleResume()}
                        okText="Resume"
                    >
                        <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            loading={resuming}
                        >
                            Resume run
                        </Button>
                    </Popconfirm>
                ) : null}
                <Button
                    icon={<ReloadOutlined />}
                    onClick={() => void loadDetail()}
                    loading={loading}
                >
                    Refresh
                </Button>
            </Space>

            {run.status === RUN_STATUS_INITIALIZING ? (
                <Alert
                    type="info"
                    showIcon
                    message="Run in progress"
                    description="This page refreshes automatically until the run finishes."
                />
            ) : null}

            {showProgress ? (
                <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                        Checkpoint: step {stepIndex} of {totalSteps}
                    </Text>
                    <Progress percent={progressPercent} size="small" status="active" />
                </div>
            ) : null}

            <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Run ID">{run.id}</Descriptions.Item>
                <Descriptions.Item label="Pipeline">
                    {run.pipeline_name?.trim() || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                    {statusTag(run.status)}
                </Descriptions.Item>
                {stepIndex != null ? (
                    <Descriptions.Item label="Step pointer">
                        {stepIndex}
                        {totalSteps != null ? ` / ${totalSteps}` : ''}
                    </Descriptions.Item>
                ) : null}
                <Descriptions.Item label="Started">
                    {dayjs(run.started_at).format('YYYY-MM-DD HH:mm:ss')} UTC
                </Descriptions.Item>
                <Descriptions.Item label="Finished">
                    {run.finished_at
                        ? dayjs(run.finished_at).format('YYYY-MM-DD HH:mm:ss') + ' UTC'
                        : '—'}
                </Descriptions.Item>
                {run.error_summary && (
                    <Descriptions.Item label="Error summary">
                        <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                            {run.error_summary}
                        </Paragraph>
                    </Descriptions.Item>
                )}
            </Descriptions>

            {contextCollapseItems.length > 0 ? (
                <div>
                    <Title level={5} style={{ marginBottom: 12 }}>Run state</Title>
                    <Collapse items={contextCollapseItems} size="small" />
                </div>
            ) : null}

            <RunReportPanel
                runId={run.id}
                pipelineUuid={run.pipeline_uuid}
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
