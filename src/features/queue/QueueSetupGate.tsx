'use client';

import React from 'react';
import { Button, Card, Result, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { WorkspaceQueueStatus } from '@/services/queue.service';

const { Title, Text, Paragraph } = Typography;

type Props = {
  status: WorkspaceQueueStatus;
};

export default function QueueSetupGate({ status }: Props) {
  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        <InboxOutlined style={{ marginRight: 8 }} />
        Queue
      </Title>
      <Card>
        <Result
          status="info"
          title="Queue is not enabled for this account"
          subTitle={
            status.enabled
              ? 'Queue is being configured. Refresh in a moment.'
              : 'An account owner or admin must enable queue in account settings before you can create project queues.'
          }
          extra={
            <Link href="/projects/settings">
              <Button type="primary">Open account settings</Button>
            </Link>
          }
        />
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          After enablement, create named queues in this project and use the SDK to push and pop messages.
        </Paragraph>
      </Card>
    </div>
  );
}
