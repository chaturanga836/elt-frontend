'use client';

import React, { useState, useEffect } from 'react';
import { Table, Tag, DatePicker, Select, Input, Space, Card, Typography } from 'antd';
import { SyncOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { PipelineService } from '@/services/pipe.service';

const { RangePicker } = DatePicker;
const { Title } = Typography;

interface PipelineRun {
    id: number;
    pipeline_uuid: string;
    status: number;
    error_summary: string | null;
    started_at: string;
    finished_at: string | null;
}

export default function HistoryComponent() {
    const [data, setData] = useState<PipelineRun[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    // State elements tying directly into backend parameters
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pipelineUuid, setPipelineUuid] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const result = await PipelineService.getPipelineRuns({
                page,
                limit: pageSize,
                pipeline_uuid: pipelineUuid || undefined,
                status: statusFilter,
                start_date: dateRange?.[0]?.startOf('day').toISOString(),
                end_date: dateRange?.[1]?.endOf('day').toISOString(),
            });
            setData(result.results || []);
            setTotal(result.meta?.total_records || 0);
        } catch (err) {
            console.error("Failed to load execution logs", err);
        } finally {
            setLoading(false);
        }
    };

    // Re-trigger fetch call every time dynamic controls update
    useEffect(() => {
        fetchHistory();
    }, [page, pageSize, pipelineUuid, statusFilter, dateRange]);

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
            render: (statusValue: number) => {
                if (statusValue === 1) return <Tag icon={<SyncOutlined spin />} color="processing">Initializing</Tag>;
                if (statusValue === 2) return <Tag icon={<CheckCircleOutlined />} color="success">Success</Tag>;
                return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
            }
        },
        {
            title: 'Execution Range (UTC)',
            key: 'execution_time',
            render: (_:any, record: PipelineRun) => (
                <div style={{ fontSize: '13px' }}>
                    <div><strong>Start:</strong> {dayjs(record.started_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                    {record.finished_at && <div><strong>End:</strong> {dayjs(record.finished_at).format('YYYY-MM-DD HH:mm:ss')}</div>}
                </div>
            )
        },
        {
            title: 'Error Summary',
            dataIndex: 'error_summary',
            key: 'error_summary',
            ellipsis: true,
            render: (text: string | null) => text || <span style={{ color: '#ccc' }}>—</span>
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Title level={4} style={{ marginBottom: '20px' }}>Pipeline Run History</Title>

            {/* Structural Filtering Control Deck */}
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
                </Space>
            </Card>

            {/* Main Historical Run Data Matrix Grid */}
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
                    }
                }}
            />
        </div>
    );
}