'use client';

import React, { useState } from 'react';
import { Button, Card, Form, Input, Select, Space, Switch, Table, Tag, Typography, notification } from 'antd';
import { PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const MOCK_JOBS = [
  {
    key: '1',
    name: 'Nightly sync',
    schedule: '0 2 * * *',
    target: 'workflow:etl-daily',
    enabled: true,
    nextRun: '2026-06-13 02:00 UTC',
  },
  {
    key: '2',
    name: 'Hourly health check',
    schedule: '0 * * * *',
    target: 'service:health-ping',
    enabled: true,
    nextRun: '2026-06-12 15:00 UTC',
  },
  {
    key: '3',
    name: 'Weekly report',
    schedule: '0 9 * * 1',
    target: 'workflow:report-export',
    enabled: false,
    nextRun: '—',
  },
];

export default function CronPage() {
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [form] = Form.useForm();

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
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
      render: (on: boolean, row: (typeof MOCK_JOBS)[0]) => (
        <Switch
          checked={on}
          size="small"
          onChange={(checked) =>
            setJobs((prev) => prev.map((j) => (j.key === row.key ? { ...j, enabled: checked } : j)))
          }
        />
      ),
    },
    { title: 'Next run', dataIndex: 'nextRun', key: 'nextRun' },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Button size="small" icon={<PlayCircleOutlined />} onClick={() => notification.info({ message: 'Triggered (prototype)' })}>
          Run now
        </Button>
      ),
    },
  ];

  const onCreate = (values: { name: string; schedule: string; target: string }) => {
    setJobs((prev) => [
      ...prev,
      {
        key: String(Date.now()),
        name: values.name,
        schedule: values.schedule,
        target: values.target,
        enabled: true,
        nextRun: '2026-06-13 00:00 UTC',
      },
    ]);
    form.resetFields();
    notification.success({ message: 'Cron job created (prototype)' });
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Cron
      </Title>
      <Text type="secondary">Schedule workflows and functions. Prototype — jobs are stored in local state only.</Text>

      <Card title="Jobs" style={{ marginTop: 16 }} extra={<Tag color="blue">{jobs.filter((j) => j.enabled).length} active</Tag>}>
        <Table columns={columns} dataSource={jobs} pagination={false} />
      </Card>

      <Card title="New cron job" style={{ marginTop: 16 }}>
        <Form form={form} layout="vertical" onFinish={onCreate} style={{ maxWidth: 480 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Nightly sync" />
          </Form.Item>
          <Form.Item name="schedule" label="Cron expression" rules={[{ required: true }]}>
            <Input placeholder="0 2 * * *" />
          </Form.Item>
          <Form.Item name="target" label="Target" rules={[{ required: true }]}>
            <Select
              placeholder="Select target"
              options={[
                { label: 'workflow:etl-daily', value: 'workflow:etl-daily' },
                { label: 'service:health-ping', value: 'service:health-ping' },
                { label: 'workflow:report-export', value: 'workflow:report-export' },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
            Create job
          </Button>
        </Form>
      </Card>
    </div>
  );
}
