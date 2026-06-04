'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Table,
    DatePicker,
    Select,
    Input,
    Space,
    Card,
    Typography,
    Button,
} from 'antd';
import {
    ReloadOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import {
    PipelineService,
    PipelineRunHistoryParams,
} from '@/services/pipe.service';
import { canViewRunDetail, statusTag } from './runDetailUtils';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';

const { RangePicker } = DatePicker;
const { Title } = Typography;

interface PipelineRun {
    id: number;
    pipeline_name?: string | null;
    status: number;
    error_summary: string | null;
    started_at: string;
    finished_at: string | null;
}

export default function HistoryComponent() {
    const workspaceId = useWorkspaceId();
    const router = useRouter();
    const [data, setData] = useState<PipelineRun[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pipelineName, setPipelineName] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

    const buildFetchParams = useCallback((): PipelineRunHistoryParams => ({
        page,
        limit: pageSize,
        pipeline_name: pipelineName || undefined,
        status: statusFilter,
        start_date: dateRange?.[0]?.startOf('day').toISOString(),
        end_date: dateRange?.[1]?.endOf('day').toISOString(),
    }), [page, pageSize, pipelineName, statusFilter, dateRange]);

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

    const openRunDetail = (runId: number) => {
        router.push(workspacePath(workspaceId, `pipe/history/${runId}`));
    };

    const columns = [
        {
            title: 'Run ID',
            dataIndex: 'id',
            key: 'id',
            width: 90,
        },
        {
            title: 'Pipeline',
            dataIndex: 'pipeline_name',
            key: 'pipeline_name',
            ellipsis: true,
            render: (text: string | null | undefined) =>
                text?.trim() ? text : <span style={{ color: '#ccc' }}>—</span>,
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
                    disabled={!canViewRunDetail(record.status)}
                    onClick={() => openRunDetail(record.id)}
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Title level={4} style={{ marginBottom: '20px' }}>Pipeline Run History</Title>

            <Card style={{ marginBottom: '16px' }} size="small">
                <Space wrap size="middle">
                    <Input
                        placeholder="Search pipeline name"
                        value={pipelineName}
                        onChange={(e) => { setPipelineName(e.target.value); setPage(1); }}
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
        </div>
    );
}
