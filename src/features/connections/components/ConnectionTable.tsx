'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Card, Typography, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, ApiOutlined, DatabaseOutlined, FileTextOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { connectionService } from '@/services/connection.service';

const { Title, Text } = Typography;

// Updated to match your Backend Response
interface ConnectionRecord {
  id: number;
  name: string;
  source_type: string; // We'll hardcode 'rest-api' for now or handle dynamic
  method: number;      // 1=GET, 2=POST etc.
  url: string;
}

export default function ConnectionsTable({ tenantId }: { tenantId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConnectionRecord[]>([]);
  const router = useRouter();

  // Load data from backend
  const loadConnections = async () => {
    setLoading(true);
    try {
      const res = await connectionService.getConnections(tenantId);
      // Since your current DB table is specific to Rest API, 
      // we inject the source_type for the table logic
      const formattedData = res.map((item: any) => ({
        ...item,
        source_type: 'rest-api' 
      }));
      setData(formattedData);
    } catch (err) {
      message.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) loadConnections();
  }, [tenantId]);

  const columns = [
    {
      title: 'Connection Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <ApiOutlined className="text-blue-500" />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    { 
      title: 'Source', 
      dataIndex: 'source_type', 
      key: 'source_type',
      render: (type: string) => <Tag color="geekblue">{type.toUpperCase()}</Tag>
    },
    {
        title: 'Endpoint',
        dataIndex: 'url',
        key: 'url',
        ellipsis: true,
        render: (url: string) => <Text type="secondary" style={{ fontSize: '12px' }}>{url}</Text>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: ConnectionRecord) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined className="text-blue-500" />} 
            onClick={() => router.push(`/connections/${record.source_type}/${record.id}/edit`)} 
          />
          <Popconfirm 
            title="Delete connection?" 
            onConfirm={() => console.log('Delete logic here')}
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
    { id: 'rest-api', name: 'Rest API', icon: <ApiOutlined />, desc: 'Connect to Binance, Nexo, etc.' },
    { id: 'db', name: 'Database', icon: <DatabaseOutlined />, desc: 'PostgreSQL, MySQL, MongoDB' },
    { id: 'file', name: 'File Storage', icon: <FileTextOutlined />, desc: 'S3, GCS, Local Files' },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <Title level={2} style={{ margin: 0 }}>Connections</Title>
            <Text type="secondary">Manage your data sources and API integrations</Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Add Connection
        </Button>
      </div>

      <Card variant="outlined" styles={{ body: { padding: 0 } }}>
        <Table 
            columns={columns} 
            dataSource={data} 
            loading={loading} 
            rowKey="id" 
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
              onClick={() => router.push(`/connections/${source.id}`)}
            >
              <div className="text-3xl text-blue-500 mb-2">{source.icon}</div>
              <Text strong>{source.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>{source.desc}</Text>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
}