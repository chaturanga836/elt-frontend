'use client';

import { useEffect, useState } from 'react';
import { Alert, Collapse, Descriptions, Spin, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { WorkflowService } from '@/services/workflow.service';

const { Title, Text, Paragraph } = Typography;

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: 'Pending', color: 'default' },
  1: { label: 'Running', color: 'processing' },
  2: { label: 'Success', color: 'success' },
  3: { label: 'Failed', color: 'error' },
};

type WorkflowRunDetail = {
  run: {
    id: number;
    workflow_uuid: string;
    status: number;
    error_summary: string | null;
    started_at: string;
    finished_at: string | null;
  };
  node_logs: Array<{
    id: number;
    node_name: string | null;
    node_uuid: string;
    step_index: number;
    status: number;
    branch_label: string | null;
    error_traceback: string | null;
    execution_time_ms: number | null;
    executed_at: string;
  }>;
};

export default function WorkflowRunDetailView({ runId }: { runId: number }) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<WorkflowRunDetail | null>(null);
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
      try {
        const data = await WorkflowService.getWorkflowRun(runId);
        if (!cancelled) setDetail(data);
      } catch {
        if (!cancelled) setError('Failed to load workflow run.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runId]);

  if (loading) return <Spin tip="Loading workflow run…" />;
  if (error) return <Alert type="error" message={error} showIcon />;
  if (!detail) return <Alert type="warning" message="Run not found." showIcon />;

  const status = STATUS_MAP[detail.run.status] || STATUS_MAP[0];

  return (
    <div>
      <Title level={4}>Workflow run #{detail.run.id}</Title>
      <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Workflow UUID">
          <Text code>{detail.run.workflow_uuid}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={status.color}>{status.label}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Started">
          {dayjs(detail.run.started_at).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
        <Descriptions.Item label="Finished">
          {detail.run.finished_at
            ? dayjs(detail.run.finished_at).format('YYYY-MM-DD HH:mm:ss')
            : '—'}
        </Descriptions.Item>
      </Descriptions>

      {detail.run.error_summary ? (
        <Alert
          type="error"
          message="Run failed"
          description={
            <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
              {detail.run.error_summary}
            </Paragraph>
          }
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Table
        size="small"
        rowKey="id"
        pagination={false}
        dataSource={detail.node_logs}
        columns={[
          { title: 'Step', dataIndex: 'step_index', width: 60 },
          {
            title: 'Node',
            render: (_, row) => row.node_name || row.node_uuid,
          },
          {
            title: 'Branch',
            dataIndex: 'branch_label',
            width: 100,
            render: (v: string | null) => v || '—',
          },
          {
            title: 'Status',
            dataIndex: 'status',
            width: 90,
            render: (v: number) => {
              const s = STATUS_MAP[v] || { label: String(v), color: 'default' };
              return <Tag color={s.color}>{s.label}</Tag>;
            },
          },
          {
            title: 'Time (ms)',
            dataIndex: 'execution_time_ms',
            width: 90,
            render: (v: number | null) => (v != null ? v : '—'),
          },
        ]}
        expandable={{
          expandedRowRender: (row) => (
            <Collapse
              size="small"
              items={[
                ...(row.error_traceback
                  ? [
                      {
                        key: 'error',
                        label: 'Error',
                        children: (
                          <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap' }}>
                            {row.error_traceback}
                          </pre>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          ),
        }}
      />
    </div>
  );
}
