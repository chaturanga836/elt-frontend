'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Dropdown, List, Space, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { NotificationItem, NotificationService } from '@/services/notification.service';

const { Text } = Typography;

const POLL_MS = 60_000;

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await NotificationService.listInbox({ limit: 20 });
      setItems(res.items);
      setUnread(res.unread);
    } catch {
      setItems([]);
      setUnread(0);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load();
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [open, load]);

  const markRead = async (id: number) => {
    await NotificationService.markRead(id);
    await load();
  };

  const markAllRead = async () => {
    await NotificationService.markAllRead();
    await load();
  };

  const dropdownContent = (
    <div style={{ width: 360, maxHeight: 400, overflow: 'auto', padding: 8 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text strong>Platform alerts</Text>
        {unread > 0 && (
          <Button type="link" size="small" onClick={() => void markAllRead()}>
            Mark all read
          </Button>
        )}
      </Space>
      <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
        Pipeline/workflow alerts for your account. Customer app realtime uses the SDK.
      </Text>
      <List
        size="small"
        locale={{ emptyText: 'No alerts' }}
        dataSource={items}
        renderItem={(item) => (
          <List.Item
            style={{
              cursor: 'pointer',
              opacity: item.read_at ? 0.65 : 1,
              background: item.read_at ? undefined : 'rgba(22, 119, 255, 0.06)',
              borderRadius: 6,
              padding: '8px 10px',
            }}
            onClick={() => {
              if (!item.read_at) void markRead(item.id);
            }}
          >
            <List.Item.Meta
              title={item.title}
              description={
                <Space orientation="vertical" size={0}>
                  {item.body && <Text type="secondary">{item.body}</Text>}
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {new Date(item.created_at).toLocaleString()}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      popupRender={() => dropdownContent}
      trigger={['click']}
    >
      <Badge count={unread} size="small" offset={[-2, 2]}>
        <Button type="text" icon={<BellOutlined />} aria-label="Platform alerts" />
      </Badge>
    </Dropdown>
  );
}
