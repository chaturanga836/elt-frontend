'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Table,
    Tag,
    DatePicker,
    Select,
    Input,
    Space,
    Card,
    Typography,
    Button,
    Drawer,
    Descriptions,
    Collapse,
} from 'antd';
import {
    SyncOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ReloadOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import {
    PipelineService,
    PipelineRunDetail,
    PipelineRunHistoryParams,
    PipelineNodeLog,
} from '@/services/pipe.service';

const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;

interface PipelineRun {
    id: number;
    pipeline_uuid: string;
    status: number;
    error_summary: string | null;
    started_at: string;
    finished_at: string | null;
}

function statusTag(statusValue: number) {
    if (statusValue === 1) {
        return <Tag icon={<SyncOutlined spin />} color="processing">Initializing</Tag>;
    }
    if (statusValue === 2) {
        return <Tag icon={<CheckCircleOutlined />} color="success">Success</Tag>;
    }
    return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
}

function formatJsonBlock(value: unknown) {
    if (value === null || value === undefined) {
        return '—';
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

export default function HistoryComponent() {
    const [data, setData] = useState<PipelineRun[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pipelineUuid, setPipelineUuid] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

    const [viewOpen, setViewOpen] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [runDetail, setRunDetail] = useState<PipelineRunDetail | null>(null);

    const buildFetchParams = useCallback((): PipelineRunHistoryParams => ({
        page,
        limit: pageSize,
        pipeline_uuid: pipelineUuid || undefined,
        status: statusFilter,
        start_date: dateRange?.[0]?.startOf('day').toISOString(),
        end_date: dateRange?.[1]?.endOf('day').toISOString(),
    }), [page, pageSize, pipelineUuid, statusFilter, dateRange]);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const result = await PipelineService.getPipelineRuns(buildFetchParams());
            setData(result.results || []);
            setTotal(result.meta?.total_records || 0);
        } catch (err) {
            console.error('Failed to load execution logs', err);
        } finally {
            setLoading(false);
        }
    }, [buildFetchParams]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleRefresh = () => {
        fetchHistory();
    };

    const openRunDetail = async (runId: number) => {
        setViewOpen(true);
        setViewLoading(true);
        setRunDetail(null);
        try {
            const detail = await PipelineService.getPipelineRunDetail(runId);
            setRunDetail(detail);
        } catch (err) {
            console.error('Failed to load run detail', err);
        } finally {
            setViewLoading(false);
        }
    };

    const closeRunDetail = () => {
        setViewOpen(false);
        setRunDetail(null);
    };

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

    const columns = [
        {
            title: 'Run ID',
            dataIndex: 'id',
            key: 'id',
            width: 90,
        },
        {
            title: 'Pipeline UUID',
            dataIndex: 'pipeline_uuid',
            key: 'pipeline_uuid',
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (statusValue: number) => statusTag(statusValue),
        },
        {
            title: 'Execution Range (UTC)',
            key: 'execution_time',
            render: (_: unknown, record: PipelineRun) => (
                <div style={{ fontSize: '13px' }}>
                    <div><strong>Start:</strong> {dayjs(record.started_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                    {record.finished_at && (
                        <div><strong>End:</strong> {dayjs(record.finished_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                    )}
                </div>
            ),
        },
        {
            title: 'Error Summary',
            dataIndex: 'error_summary',
            key: 'error_summary',
            ellipsis: true,
            render: (text: string | null) => text || <span style={{ color: '#ccc' }}>—</span>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_: unknown, record: PipelineRun) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => openRunDetail(record.id)}
                >
                    View
                </Button>
            ),
        },
    ];

    const collapseItems = (runDetail?.node_logs ?? []).map((log: PipelineNodeLog) => ({
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
        <div style={{ padding: '24px' }}>
            <Title level={4} style={{ marginBottom: '20px' }}>Pipeline Run History</Title>

            <Card style={{ marginBottom: '16px' }} size="small">
                <Space wrap size="middle">
                    <Input
                        placeholder="Search Pipeline UUID"
                        value={pipelineUuid}
                        onChange={(e) => { setPipelineUuid(e.target.value); setPage(1); }}
                        style={{ width: 240 }}
                        allowClear
                    />

                    <Select
                        placeholder="Filter by Status"
                        value={statusFilter}
                        onChange={(value) => { setStatusFilter(value); setPage(1); }}
                        style={{ width: 160 }}
                        allowClear
                        options={[
                            { value: 1, label: 'Initializing' },
                            { value: 2, label: 'Success' },
                            { value: 3, label: 'Failed' },
                        ]}
                    />

                    <RangePicker
                        value={dateRange}
                        onChange={(dates) => { setDateRange(dates); setPage(1); }}
                    />

                    <Button
                        icon={<ReloadOutlined />}
                        onClick={handleRefresh}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </Space>
            </Card>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: page,
                    pageSize: pageSize,
                    total: total,
                    showSizeChanger: true,
                    onChange: (newPage, newPageSize) => {
                        setPage(newPage);
                        setPageSize(newPageSize);
                    },
                }}
            />

            <Drawer
                title={runDetail ? `Run #${runDetail.run.id}` : 'Execution details'}
                open={viewOpen}
                onClose={closeRunDetail}
                width={720}
                destroyOnClose
            >
                {viewLoading && <Text type="secondary">Loading…</Text>}

                {!viewLoading && runDetail && (
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Descriptions column={1} size="small" bordered>
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
                )}
            </Drawer>
        </div>
    );
}
