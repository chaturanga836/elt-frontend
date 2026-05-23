'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Card,
  Typography,
  Space,
  Popconfirm,
  message,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  ApiOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { connectionService } from '@/services/connection.service';

const { Title, Text } = Typography;

interface ConnectionRecord {
  id: number;
  name: string;
  source_type: string;
  category_id?: number;
  prototype_id?: string;
  url?: string;
  description?: string;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  'rest-api': <ApiOutlined className="text-blue-500" />,
  db: <DatabaseOutlined className="text-green-600" />,
  file: <FileTextOutlined className="text-orange-500" />,
};

const SOURCE_LABELS: Record<string, string> = {
  'rest-api': 'REST API',
  db: 'Database',
  file: 'Storage',
};

function editPath(record: ConnectionRecord): string {
  if (record.source_type === 'rest-api') {
    return `/connections/rest-api/${record.id}/edit`;
  }
  if (record.source_type === 'db') {
    return `/connections/database/${record.id}/edit`;
  }
  if (record.source_type === 'file') {
    return `/connections/storage/${record.id}/edit`;
  }
  return '/connections';
}

function createPath(sourceId: string): string {
  if (sourceId === 'rest-api') return '/connections/rest-api';
  if (sourceId === 'db') return '/connections/database';
  if (sourceId === 'file') return '/connections/storage';
  return '/connections';
}

export default function ConnectionsTable({ tenantId }: { tenantId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConnectionRecord[]>([]);
  const router = useRouter();

  const loadConnections = async () => {
    setLoading(true);
    try {
      const res = await connectionService.getUnifiedConnections(tenantId);
      setData(res);
    } catch {
      message.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) loadConnections();
  }, [tenantId]);

  const handleDelete = async (record: ConnectionRecord) => {
    try {
      if (record.source_type === 'rest-api') {
        message.info('REST API delete coming soon');
        return;
      }
      await connectionService.deleteGenericConnection(record.id, tenantId);
      message.success('Connection deleted');
      loadConnections();
    } catch {
      message.error('Failed to delete connection');
    }
  };

  const columns = [
    {
      title: 'Connection Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ConnectionRecord) => (
        <Space>
          {SOURCE_ICONS[record.source_type] || <ApiOutlined />}
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source_type',
      key: 'source_type',
      render: (type: string, record: ConnectionRecord) => (
        <Space direction="vertical" size={0}>
          <Tag color="geekblue">{SOURCE_LABELS[type] || type}</Tag>
          {record.prototype_id && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.prototype_id}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Details',
      key: 'details',
      ellipsis: true,
      render: (_: unknown, record: ConnectionRecord) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {record.url || record.description || '—'}
        </Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: ConnectionRecord) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined className="text-blue-500" />}
            onClick={() => router.push(editPath(record))}
          />
          <Popconfirm
            title="Delete connection?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const sourceTypes = [
    {
      id: 'rest-api',
      name: 'REST API',
      icon: <ApiOutlined />,
      desc: 'Postman-style HTTP client',
    },
    {
      id: 'db',
      name: 'Database',
      icon: <DatabaseOutlined />,
      desc: 'PostgreSQL, MySQL, MongoDB, and more',
    },
    {
      id: 'file',
      name: 'File Storage',
      icon: <FileTextOutlined />,
      desc: 'S3, SFTP, or local filesystem',
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Connections
          </Title>
          <Text type="secondary">
            REST APIs, databases, and storage in one place
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Connection
        </Button>
      </div>

      <Card variant="outlined" styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey={(r) => `${r.source_type}-${r.id}`}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title="Select Connection Source"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
        centered
      >
        <div className="grid grid-cols-3 gap-4 py-4">
          {sourceTypes.map((source) => (
            <Card
              hoverable
              key={source.id}
              className="text-center border-2 hover:border-blue-500 transition-all"
              onClick={() => {
                setIsModalOpen(false);
                router.push(createPath(source.id));
              }}
            >
              <div className="text-3xl text-blue-500 mb-2">{source.icon}</div>
              <Text strong>{source.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {source.desc}
              </Text>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
}
