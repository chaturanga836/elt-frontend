'use client';

import React, { useState } from 'react';
import {
  Breadcrumb,
  Button,
  Card,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  notification,
} from 'antd';
import { CloudUploadOutlined, FolderAddOutlined, FolderOutlined, FileOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const MOCK_OBJECTS = [
  { key: '1', name: 'avatars/', type: 'folder', size: '—', modified: '2026-06-10 14:22' },
  { key: '2', name: 'exports/', type: 'folder', size: '—', modified: '2026-06-09 09:15' },
  { key: '3', name: 'report-q2.pdf', type: 'file', size: '2.4 MB', modified: '2026-06-08 18:40' },
  { key: '4', name: 'data.json', type: 'file', size: '128 KB', modified: '2026-06-07 11:02' },
];

export default function StorageBrowserPage() {
  const [bucket, setBucket] = useState('project-assets');
  const [createOpen, setCreateOpen] = useState(false);
  const [newBucket, setNewBucket] = useState('');

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name: string, row: (typeof MOCK_OBJECTS)[0]) => (
        <Space>
          {row.type === 'folder' ? <FolderOutlined /> : <FileOutlined />}
          <Text>{name}</Text>
        </Space>
      ),
    },
    { title: 'Size', dataIndex: 'size', width: 100 },
    { title: 'Modified', dataIndex: 'modified', width: 180 },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 90,
      render: (t: string) => <Tag>{t}</Tag>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Storage
      </Title>
      <Text type="secondary">MinIO object storage for this project. Prototype — mock buckets and objects.</Text>

      <Card style={{ marginTop: 16 }}>
        <Space wrap style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Text strong>Bucket:</Text>
            <Tag color="blue">{bucket}</Tag>
            <Button size="small" onClick={() => setCreateOpen(true)}>
              Switch / create bucket
            </Button>
          </Space>
          <Space>
            <Upload showUploadList={false} beforeUpload={() => { notification.info({ message: 'Upload simulated (prototype)' }); return false; }}>
              <Button icon={<CloudUploadOutlined />}>Upload</Button>
            </Upload>
            <Button icon={<FolderAddOutlined />}>New folder</Button>
          </Space>
        </Space>

        <Breadcrumb items={[{ title: bucket }, { title: '/' }]} style={{ marginBottom: 12 }} />

        <Table columns={columns} dataSource={MOCK_OBJECTS} pagination={false} size="middle" />
      </Card>

      <Modal
        title="Buckets"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => {
          if (newBucket.trim()) setBucket(newBucket.trim());
          setCreateOpen(false);
          notification.success({ message: 'Bucket selected (prototype)' });
        }}
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Button block type={bucket === 'project-assets' ? 'primary' : 'default'} onClick={() => setBucket('project-assets')}>
            project-assets
          </Button>
          <Button block type={bucket === 'uploads' ? 'primary' : 'default'} onClick={() => setBucket('uploads')}>
            uploads
          </Button>
          <Text type="secondary">Or create new:</Text>
          <input
            className="ant-input"
            placeholder="new-bucket-name"
            value={newBucket}
            onChange={(e) => setNewBucket(e.target.value)}
          />
        </Space>
      </Modal>
    </div>
  );
}
