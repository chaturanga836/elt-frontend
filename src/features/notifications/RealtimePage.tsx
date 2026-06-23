'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Input, List, Space, Tag, Typography, notification } from 'antd';
import { SendOutlined, WifiOutlined } from '@ant-design/icons';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useRealtime } from '@/features/notifications/RealtimeProvider';
import { NotificationService, channelNamed } from '@/services/notification.service';
import { StudioService } from '@/services/studio.service';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text } = Typography;

type LogEntry = { id: number; text: string };

export default function RealtimePage() {
  const workspaceId = useWorkspaceId();
  const { connected, subscribe, unsubscribe } = useRealtime();
  const [channel, setChannel] = useState('general');
  const [message, setMessage] = useState('');
  const [orgId, setOrgId] = useState<number | null>(null);
  const [subscribed, setSubscribed] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    StudioService.getAccount()
      .then((a) => setOrgId(a.organization.id))
      .catch(() => setOrgId(null));
  }, []);

  const fullChannel =
    orgId != null ? channelNamed(orgId, workspaceId, channel) : null;

  const appendLog = (text: string) => {
    setLog((prev) => [...prev, { id: Date.now(), text }]);
  };

  const onSubscribe = () => {
    if (!fullChannel) return;
    if (subscribed && subscribed !== fullChannel) {
      unsubscribe(subscribed);
    }
    subscribe(fullChannel, (data) => {
      appendLog(`[message] ${JSON.stringify(data)}`);
    });
    setSubscribed(fullChannel);
    appendLog(`[subscribed] ${fullChannel}`);
  };

  const onUnsubscribe = () => {
    if (!subscribed) return;
    unsubscribe(subscribed);
    appendLog(`[unsubscribed] ${subscribed}`);
    setSubscribed(null);
  };

  const onPublish = async () => {
    if (!message.trim()) return;
    try {
      await NotificationService.publish(workspaceId, {
        channel,
        payload: { text: message, ts: Date.now() },
      });
      appendLog(`[publish] ${channel}: ${message}`);
      setMessage('');
      notification.success({ message: 'Message published' });
    } catch (err) {
      notification.error({
        message: 'Publish failed',
        description: getApiErrorMessage(err),
      });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Realtime
      </Title>
      <Text type="secondary">
        Centrifugo channels for live updates. Subscribe to test channels and publish from this project.
      </Text>

      <Card style={{ marginTop: 16 }}>
        <Space>
          <WifiOutlined />
          <Badge status={connected ? 'success' : 'default'} text={connected ? 'Connected' : 'Disconnected'} />
          <Tag color="purple">Centrifugo</Tag>
        </Space>
      </Card>

      <Card title="Channel" style={{ marginTop: 16 }}>
        <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
          <Input
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="Channel name (e.g. general)"
          />
          <Button type="primary" onClick={onSubscribe} disabled={!connected}>
            Subscribe
          </Button>
          <Button onClick={onUnsubscribe} disabled={!subscribed}>
            Unsubscribe
          </Button>
        </Space.Compact>
        {fullChannel && (
          <Text type="secondary" copyable style={{ fontSize: 12 }}>
            {fullChannel}
          </Text>
        )}
      </Card>

      <Card title="Test publish" style={{ marginTop: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message for ${channel}`}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={() => void onPublish()}>
            Publish
          </Button>
        </Space.Compact>
      </Card>

      <Card title="Message log" style={{ marginTop: 16 }}>
        <List
          size="small"
          dataSource={[...log].reverse()}
          locale={{ emptyText: 'Subscribe and publish to see events' }}
          renderItem={(item) => <List.Item>{item.text}</List.Item>}
        />
      </Card>
    </div>
  );
}
