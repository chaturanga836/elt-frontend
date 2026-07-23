'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  notification,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { palette } from '@/constants/theme';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { getApiErrorMessage } from '@/lib/formatApiError';
import {
  CronJobItem,
  CronJobLogItem,
  CronService,
} from '@/services/cron.service';

const { Title, Text } = Typography;

const NAME_PATTERN = /^[a-z][a-z0-9_-]{0,98}[a-z0-9]$|^[a-z]$/;

const TARGET_OPTIONS = [
  { label: 'workflow:etl-daily', value: 'workflow:etl-daily' },
  { label: 'service:health-ping', value: 'service:health-ping' },
  { label: 'workflow:report-export', value: 'workflow:report-export' },
  { label: 'local:demo-jobs', value: 'local:demo-jobs' },
];

export default function CronPage() {
  const workspaceId = useWorkspaceId();
  const [jobs, setJobs] = useState<CronJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [logs, setLogs] = useState<CronJobLogItem[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [historyEnabled, setHistoryEnabled] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const selected = jobs.find((j) => j.name === selectedName) ?? null;

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await CronService.list(workspaceId);
      setJobs(res.items);
      if (selectedName && !res.items.some((j) => j.name === selectedName)) {
        setSelectedName(null);
      }
    } catch (err) {
      notification.error({
        message: 'Failed to load cron jobs',
        description: getApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, selectedName]);

  const loadLogs = useCallback(
    async (name: string) => {
      setLogsLoading(true);
      try {
        const res = await CronService.listLogs(workspaceId, name, { limit: 50 });
        setLogs(res.items);
        setLogsTotal(res.total);
        setHistoryEnabled(res.history_log);
      } catch (err) {
        notification.error({
          message: 'Failed to load cron history',
          description: getApiErrorMessage(err),
        });
      } finally {
        setLogsLoading(false);
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (!selectedName) {
      setLogs([]);
      setLogsTotal(0);
      setHistoryEnabled(false);
      return;
    }
    void loadLogs(selectedName);
    const timer = window.setInterval(() => {
      void loadLogs(selectedName);
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [selectedName, loadLogs]);

  const onCreate = async (values: {
    name: string;
    schedule: string;
    target: string;
    history_log: boolean;
  }) => {
    setCreating(true);
    try {
      await CronService.create(workspaceId, {
        name: values.name.trim().toLowerCase(),
        schedule: values.schedule.trim(),
        target: values.target,
        history_log: Boolean(values.history_log),
        enabled: true,
      });
      notification.success({ message: 'Cron job created' });
      form.resetFields();
      setCreateOpen(false);
      void loadJobs();
    } catch (err) {
      notification.error({
        message: 'Could not create cron job',
        description: getApiErrorMessage(err),
      });
    } finally {
      setCreating(false);
    }
  };

  const onToggleEnabled = async (job: CronJobItem, enabled: boolean) => {
    try {
      await CronService.update(workspaceId, job.name, { enabled });
      void loadJobs();
    } catch (err) {
      notification.error({
        message: 'Could not update job',
        description: getApiErrorMessage(err),
      });
    }
  };

  const onToggleHistory = async (job: CronJobItem, history_log: boolean) => {
    try {
      await CronService.update(workspaceId, job.name, { history_log });
      await loadJobs();
      if (selectedName === job.name) {
        void loadLogs(job.name);
      }
    } catch (err) {
      notification.error({
        message: 'Could not update history setting',
        description: getApiErrorMessage(err),
      });
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => setSelectedName(name)}>
          {name}
        </Button>
      ),
    },
    {
      title: 'Schedule',
      dataIndex: 'schedule',
      key: 'schedule',
      render: (s: string) => <Tag style={{ fontFamily: 'monospace' }}>{s}</Tag>,
    },
    { title: 'Target', dataIndex: 'target', key: 'target' },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (on: boolean, row: CronJobItem) => (
        <Switch checked={on} size="small" onChange={(checked) => void onToggleEnabled(row, checked)} />
      ),
    },
    {
      title: 'History',
      dataIndex: 'history_log',
      key: 'history_log',
      render: (on: boolean, row: CronJobItem) => (
        <Switch
          checked={on}
          size="small"
          onChange={(checked) => void onToggleHistory(row, checked)}
        />
      ),
    },
    {
      title: 'Monitor',
      key: 'monitor',
      render: (_: unknown, row: CronJobItem) => (
        <Button size="small" type={selectedName === row.name ? 'primary' : 'default'} onClick={() => setSelectedName(row.name)}>
          View
        </Button>
      ),
    },
  ];

  const logColumns = [
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 200,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => (
        <Tag color={level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'default'}>
          {level}
        </Tag>
      ),
    },
    { title: 'Message', dataIndex: 'message', key: 'message' },
    {
      title: 'Metadata',
      dataIndex: 'metadata',
      key: 'metadata',
      render: (meta: Record<string, unknown>) => (
        <Text code style={{ fontSize: 12 }}>
          {JSON.stringify(meta ?? {})}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Cron
      </Title>
      <Text type="secondary">
        Schedule definitions and SDK-pushed history. Platform Beat scheduling is not wired yet —
        customer apps push logs via <Text code>runtime.cronPushLogs</Text>.
      </Text>
      <div style={{ marginTop: 12 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setCreateOpen(true);
          }}
        >
          New cron job
        </Button>
      </div>

      <Card
        title="Jobs"
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Tag color={palette.primary}>{jobs.filter((j) => j.enabled).length} active</Tag>
            <Button icon={<ReloadOutlined />} onClick={() => void loadJobs()} />
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={jobs}
          pagination={false}
          rowClassName={(row) => (row.name === selectedName ? 'ant-table-row-selected' : '')}
        />
      </Card>

      <Modal
        title="New cron job"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        destroyOnHidden
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => void onCreate(values)}
          initialValues={{ history_log: false }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true },
              {
                pattern: NAME_PATTERN,
                message: 'Lowercase letter start; letters, digits, hyphens, underscores',
              },
            ]}
          >
            <Input placeholder="demo-jobs" />
          </Form.Item>
          <Form.Item name="schedule" label="Cron expression" rules={[{ required: true }]}>
            <Input placeholder="0 2 * * *" />
          </Form.Item>
          <Form.Item name="target" label="Target" rules={[{ required: true }]}>
            <Select placeholder="Select target" options={TARGET_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="history_log"
            label="History log"
            valuePropName="checked"
            extra="When on, SDK push logs appear in the monitor below."
          >
            <Switch />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={creating} block>
            Create job
          </Button>
        </Form>
      </Modal>

      <Card
        title={selected ? `Monitor — ${selected.name}` : 'Monitor'}
        style={{ marginTop: 16 }}
        extra={
          selected ? (
            <Button
              icon={<ReloadOutlined />}
              loading={logsLoading}
              onClick={() => void loadLogs(selected.name)}
            >
              Refresh
            </Button>
          ) : null
        }
      >
        {!selected ? (
          <Empty description="Select a job to view history" />
        ) : !historyEnabled && !selected.history_log ? (
          <Empty description="History log is off for this job. Enable History to store and view SDK push logs." />
        ) : logs.length === 0 ? (
          <Empty description="No history yet. Push logs from your app with runtime.cronPushLogs." />
        ) : (
          <>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              {logsTotal} log{logsTotal === 1 ? '' : 's'} (auto-refresh every 10s)
            </Text>
            <Table
              rowKey="id"
              loading={logsLoading}
              columns={logColumns}
              dataSource={logs}
              pagination={false}
              size="small"
            />
          </>
        )}
      </Card>
    </div>
  );
}
