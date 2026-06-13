'use client';

import React, { useState } from 'react';
import { Badge, Button, Card, Input, List, Space, Tag, Typography, notification } from 'antd';
import { SendOutlined, WifiOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const MOCK_CHANNELS = [
  { name: 'presence:lobby', subscribers: 12 },
  { name: 'chat:general', subscribers: 4 },
  { name: 'events:orders', subscribers: 0 },
];

export default function RealtimePage() {
  const [connected, setConnected] = useState(true);
  const [channel, setChannel] = useState('chat:general');
  const [message, setMessage] = useState('');
  const [log, setLog] = useState<{ id: number; text: string }[]>([
    { id: 1, text: '[subscribed] chat:general' },
    { id: 2, text: '{"type":"ping","ts":1718190000}' },
  ]);

  const onPublish = () => {
    if (!message.trim()) return;
    setLog((prev) => [...prev, { id: Date.now(), text: `[publish] ${channel}: ${message}` }]);
    setMessage('');
    notification.success({ message: 'Message published (prototype mock)' });
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Realtime
      </Title>
      <Text type="secondary">Centrifugo channels for live updates. Prototype — connection and messages are simulated.</Text>

      <Card style={{ marginTop: 16 }}>
        <Space>
          <WifiOutlined />
          <Badge status={connected ? 'success' : 'default'} text={connected ? 'Connected' : 'Disconnected'} />
          <Button size="small" onClick={() => setConnected((c) => !c)}>
            {connected ? 'Disconnect' : 'Connect'}
          </Button>
          <Tag color="purple">Centrifugo</Tag>
        </Space>
      </Card>

      <Card title="Channels" style={{ marginTop: 16 }}>
        <List
          dataSource={MOCK_CHANNELS}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key="sub" size="small" type={channel === item.name ? 'primary' : 'default'} onClick={() => setChannel(item.name)}>
                  Subscribe
                </Button>,
              ]}
            >
              <List.Item.Meta title={item.name} description={`${item.subscribers} subscribers`} />
            </List.Item>
          )}
        />
      </Card>

      <Card title="Test publish" style={{ marginTop: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Message for ${channel}`} />
          <Button type="primary" icon={<SendOutlined />} onClick={onPublish}>
            Publish
          </Button>
        </Space.Compact>
      </Card>

      <Card title="Message log" style={{ marginTop: 16 }}>
        <List
          size="small"
          dataSource={[...log].reverse()}
          renderItem={(item) => <List.Item>{item.text}</List.Item>}
        />
      </Card>
    </div>
  );
}
