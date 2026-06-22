'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  notification,
} from 'antd';
import { DeleteOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { QueueItem, QueueService } from '@/services/queue.service';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text } = Typography;

const NAME_PATTERN = /^[a-z][a-z0-9_-]{0,98}[a-z0-9]$|^[a-z]$/;

type PeekMessage = {
  id: number;
  payload: unknown;
  created_at?: string | null;
};

export default function QueuePage() {
  const workspaceId = useWorkspaceId();
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [peekOpen, setPeekOpen] = useState(false);
  const [peekLoading, setPeekLoading] = useState(false);
  const [peekQueue, setPeekQueue] = useState<string | null>(null);
  const [peekMessage, setPeekMessage] = useState<PeekMessage | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await QueueService.list(workspaceId);
      setQueues(res.items);
    } catch (err) {
      notification.error({ message: 'Failed to load queues', description: getApiErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (values: { name: string; description?: string; max_depth?: number }) => {
    try {
      await QueueService.create(workspaceId, {
        name: values.name.trim().toLowerCase(),
        description: values.description,
        max_depth: values.max_depth,
      });
      notification.success({ message: 'Queue created' });
      setCreateOpen(false);
      form.resetFields();
      void load();
    } catch (err) {
      notification.error({ message: 'Could not create queue', description: getApiErrorMessage(err) });
    }
  };

  const onDelete = (name: string) => {
    Modal.confirm({
      title: `Delete queue "${name}"?`,
      content: 'Only empty queues can be deleted.',
      okType: 'danger',
      onOk: async () => {
        try {
          await QueueService.delete(workspaceId, name);
          notification.success({ message: 'Queue deleted' });
          void load();
        } catch (err) {
          notification.error({ message: 'Could not delete queue', description: getApiErrorMessage(err) });
        }
      },
    });
  };

  const onPeek = async (name: string) => {
    setPeekQueue(name);
    setPeekOpen(true);
    setPeekLoading(true);
    setPeekMessage(null);
    try {
      const res = await QueueService.peek(workspaceId, name);
      setPeekMessage(res);
    } catch (err) {
      notification.error({ message: 'Peek failed', description: getApiErrorMessage(err) });
    } finally {
      setPeekLoading(false);
    }
  };

  const columns = [
    { title: 'Queue', dataIndex: 'name', key: 'name' },
    { title: 'Depth', dataIndex: 'depth', key: 'depth', width: 90 },
    { title: 'Max depth', dataIndex: 'max_depth', key: 'max_depth', width: 110 },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string | null | undefined) => (v ? new Date(v).toLocaleString() : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: unknown, row: QueueItem) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => void onPeek(row.name)}>
            Peek
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            disabled={row.depth > 0}
            onClick={() => onDelete(row.name)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
            Queues
          </Title>
          <Text type="secondary">Project-scoped message queues. Use the SDK to push and pop messages.</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Create queue
          </Button>
        </Space>
      </Space>

      <Card>
        <Table rowKey="id" loading={loading} columns={columns} dataSource={queues} pagination={false} />
      </Card>

      <Modal
        title="Create queue"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={onCreate}>
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true },
              {
                pattern: NAME_PATTERN,
                message: 'Lowercase letters, digits, hyphens, underscores; start with a letter',
              },
            ]}
          >
            <Input placeholder="email-dispatch" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="max_depth" label="Max depth" initialValue={10000}>
            <InputNumber min={1} max={1000000} style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Create
          </Button>
        </Form>
      </Modal>

      <Drawer
        title={peekQueue ? `Peek: ${peekQueue}` : 'Message'}
        open={peekOpen}
        onClose={() => setPeekOpen(false)}
        width={480}
        loading={peekLoading}
      >
        {!peekLoading && !peekMessage && (
          <Text type="secondary">Queue is empty.</Text>
        )}
        {peekMessage && (
          <Card size="small">
            <Text code>msg-{peekMessage.id}</Text>
            {peekMessage.created_at && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">{new Date(peekMessage.created_at).toLocaleString()}</Text>
              </div>
            )}
            <pre style={{ marginTop: 8, fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(peekMessage.payload, null, 2)}
            </pre>
          </Card>
        )}
      </Drawer>
    </div>
  );
}
