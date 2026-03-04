'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Card, Typography, Space, Popconfirm } from 'antd';
import { PlusOutlined, ApiOutlined, DatabaseOutlined, FileTextOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface ConnectionRecord {
  id: string;
  name: string;
  source_type: 'rest-api' | 'db' | 'file';
  icon: string;
}

export default function ConnectionsTable() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]); // Will fetch from backend
  const router = useRouter();

  const columns :any[] = [
    {
      title: 'Connection Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <img src={record.icon} alt="icon" style={{ width: 24 }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    { title: 'Source', dataIndex: 'source_type', key: 'source_type' },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: ConnectionRecord) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => router.push(`/connections/${record.source_type}/${record.id}/edit`)} 
          />
          <Popconfirm title="Delete connection?" onConfirm={() => console.log('Delete', record.id)}>
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
      <div className="flex justify-between mb-6">
        <Title level={2}>Connections</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Add Connection
        </Button>
      </div>

      <Table columns={columns} dataSource={data} loading={loading} rowKey="id" />

      {/* Source Picker Modal */}
      <Modal
        title="Select Connection Source"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        <div className="grid grid-cols-3 gap-4 py-4">
          {sourceTypes.map((source) => (
            <Card
              hoverable
              key={source.id}
              className="text-center"
              onClick={() => router.push(`/connections/${source.id}`)}
            >
              <div className="text-3xl text-blue-500 mb-2">{source.icon}</div>
              <Text strong>{source.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>{source.desc}</Text>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
}