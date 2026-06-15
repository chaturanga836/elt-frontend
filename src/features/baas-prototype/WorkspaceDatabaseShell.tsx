'use client';

import React, { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Flex,
  Modal,
  Space,
  Tag,
  Typography,
} from 'antd';
import { DatabaseOutlined, PlusOutlined } from '@ant-design/icons';
import WorkspaceDatabaseSetup from '@/features/baas-prototype/WorkspaceDatabaseSetup';
import {
  WorkspaceDatabaseItem,
  WorkspaceDatabaseStatus,
} from '@/services/workspaceDatabase.service';

const { Text } = Typography;

type Props = {
  workspaceId: number;
  status: WorkspaceDatabaseStatus;
  onStatusChange: (status: WorkspaceDatabaseStatus) => void;
  children: React.ReactNode;
};

function formatProvisionedAt(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

function DatabaseLocation({ db }: { db: WorkspaceDatabaseItem }) {
  const parts = [
    db.engine === 'postgres' ? 'PostgreSQL schema' : db.engine,
    db.instance_ref ? `container ${db.instance_ref}` : null,
  ].filter(Boolean);

  return (
    <Text type="secondary" style={{ fontSize: 12 }}>
      {parts.join(' · ')}
    </Text>
  );
}

export default function WorkspaceDatabaseShell({
  workspaceId,
  status,
  onStatusChange,
  children,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const databases = status.databases ?? [];

  return (
    <div>
      <Card size="small" style={{ margin: '16px 16px 0', borderRadius: 8 }}>
        <Flex justify="space-between" align="flex-start" wrap="gap" gap={12}>
          <Space direction="vertical" size={4} style={{ flex: 1, minWidth: 240 }}>
            <Flex align="center" gap={8}>
              <DatabaseOutlined style={{ color: '#1677ff' }} />
              <Text strong>Project databases</Text>
              <Badge count={databases.length} showZero color="#1677ff" />
            </Flex>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Each database is a PostgreSQL schema inside your project&apos;s database container.
            </Text>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
            Add database
          </Button>
        </Flex>

        <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 12 }}>
          {databases.map((db) => (
            <Card key={db.id} size="small" type="inner" styles={{ body: { padding: '10px 12px' } }}>
              <Flex justify="space-between" align="center" wrap="gap" gap={8}>
                <Space direction="vertical" size={0}>
                  <Space size={8}>
                    <Text strong>{db.name}</Text>
                    <Tag color="blue">{db.engine}</Tag>
                    <Tag color={db.status === 'ready' ? 'success' : 'default'}>{db.status}</Tag>
                  </Space>
                  <DatabaseLocation db={db} />
                </Space>
                {formatProvisionedAt(db.provisioned_at) && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Created {formatProvisionedAt(db.provisioned_at)}
                  </Text>
                )}
              </Flex>
            </Card>
          ))}
        </Space>
      </Card>

      {children}

      <Modal
        title="Add database"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        <WorkspaceDatabaseSetup
          workspaceId={workspaceId}
          mode="add"
          existingNames={databases.map((db) => db.name)}
          onProvisioned={(next) => {
            onStatusChange(next);
            setAddOpen(false);
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>
    </div>
  );
}
