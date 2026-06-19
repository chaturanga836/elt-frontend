'use client';

import React, { useState } from 'react';
import { Button, Card, Drawer, Space, Table, Tag, Typography } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const MOCK_QUEUES = [
  { key: '1', name: 'email-dispatch', depth: 24, dlq: 2, consumers: 3 },
  { key: '2', name: 'webhook-retry', depth: 5, dlq: 0, consumers: 1 },
  { key: '3', name: 'image-processing', depth: 102, dlq: 8, consumers: 5 },
];

const MOCK_MESSAGES = [
  { id: 'msg-901', payload: '{"to":"user@example.com","template":"welcome"}', age: '12s' },
  { id: 'msg-902', payload: '{"to":"admin@example.com","template":"alert"}', age: '45s' },
];

export default function QueuePage() {
  const [peekOpen, setPeekOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);

  const columns = [
    { title: 'Queue', dataIndex: 'name', key: 'name' },
    { title: 'Depth', dataIndex: 'depth', key: 'depth', width: 90 },
    {
      title: 'DLQ',
      dataIndex: 'dlq',
      key: 'dlq',
      width: 80,
      render: (n: number) => (n > 0 ? <Tag color="red">{n}</Tag> : <Tag>0</Tag>),
    },
    { title: 'Consumers', dataIndex: 'consumers', key: 'consumers', width: 100 },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, row: (typeof MOCK_QUEUES)[0]) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedQueue(row.name);
            setPeekOpen(true);
          }}
        >
          Peek
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Queue
      </Title>
      <Text type="secondary">Project-scoped message queues. Prototype — mock depth and message peek.</Text>

      <Card style={{ marginTop: 16 }}>
        <Table columns={columns} dataSource={MOCK_QUEUES} pagination={false} />
      </Card>

      <Drawer
        title={selectedQueue ? `Peek: ${selectedQueue}` : 'Messages'}
        open={peekOpen}
        onClose={() => setPeekOpen(false)}
        width={480}
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          {MOCK_MESSAGES.map((m) => (
            <Card key={m.id} size="small">
              <Text code>{m.id}</Text>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">age {m.age}</Text>
              </div>
              <pre style={{ marginTop: 8, fontSize: 12, whiteSpace: 'pre-wrap' }}>{m.payload}</pre>
            </Card>
          ))}
        </Space>
      </Drawer>
    </div>
  );
}
