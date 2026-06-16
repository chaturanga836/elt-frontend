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
import WorkspaceDatabaseExplorer from '@/features/baas-prototype/WorkspaceDatabaseExplorer';
import {
  WorkspaceDatabaseStatus,
  WorkspaceDatabaseTableDetail,
} from '@/services/workspaceDatabase.service';

const { Text } = Typography;

type Props = {
  workspaceId: number;
  status: WorkspaceDatabaseStatus;
  onStatusChange: (status: WorkspaceDatabaseStatus) => void;
  children: React.ReactNode;
};

export default function WorkspaceDatabaseShell({
  workspaceId,
  status,
  onStatusChange,
  children,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<WorkspaceDatabaseTableDetail | null>(null);
  const [showExplorer, setShowExplorer] = useState(true);
  const databases = status.databases ?? [];

  return (
    <div>
      <Card size="small" style={{ margin: '16px 16px 0', borderRadius: 8 }}>
        <Flex justify="space-between" align="center" wrap gap={12}>
          <Space>
            <DatabaseOutlined style={{ color: '#1677ff' }} />
            <Text strong>Project databases</Text>
            <Badge count={databases.length} showZero color="#1677ff" />
            {databases.map((db) => (
              <Tag key={db.id} color="blue">
                {db.name}
              </Tag>
            ))}
          </Space>
          <Space>
            <Button
              type={showExplorer ? 'primary' : 'default'}
              onClick={() => setShowExplorer((v) => !v)}
            >
              {showExplorer ? 'Hide browser' : 'Browse schemas'}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
              Add database
            </Button>
          </Space>
        </Flex>
      </Card>

      {showExplorer && (
        <div style={{ margin: '0 16px', border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
          <WorkspaceDatabaseExplorer
            workspaceId={workspaceId}
            databases={databases}
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
          />
        </div>
      )}

      <div style={{ padding: children ? 16 : 0 }}>{children}</div>

      <Modal
        title="Add database"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        footer={null}
        destroyOnHidden
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
