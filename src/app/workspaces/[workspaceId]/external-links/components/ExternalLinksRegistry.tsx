'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Card,
  Modal,
  Form,
  Select,
  Tag,
  Typography,
  Popconfirm,
  notification,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  ExternalLinkService,
  ExternalLinkResponse,
  ExternalLinkPayload,
} from '@/services/external-link.service';

const { Text, Paragraph } = Typography;

const CATEGORIES = [
  { value: 'API', label: 'API' },
  { value: 'Webhook', label: 'Webhook' },
  { value: 'Storage', label: 'Storage' },
  { value: 'CDN', label: 'CDN' },
  { value: 'Service', label: 'Service' },
  { value: 'Other', label: 'Other' },
];

export default function ExternalLinksRegistry() {
  const [data, setData] = useState<{ items: ExternalLinkResponse[]; total: number }>({
    items: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [params, setParams] = useState({
    page: 1,
    limit: 20,
    sort_by: 'updated_at',
    sort_order: 'desc' as 'asc' | 'desc',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ExternalLinkResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ExternalLinkService.list({
        ...params,
        query: searchText,
      });
      setData({ items: response.items, total: response.total });
    } catch {
      notification.error({ message: 'Failed to fetch external links' });
    } finally {
      setLoading(false);
    }
  }, [params, searchText]);

  useEffect(() => {
    const handler = setTimeout(() => fetchLinks(), 300);
    return () => clearTimeout(handler);
  }, [fetchLinks]);

  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    setParams((prev) => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
      sort_by: sorter.field || 'updated_at',
      sort_order: sorter.order === 'ascend' ? 'asc' : 'desc',
    }));
  };

  const openCreateModal = () => {
    setEditingLink(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (link: ExternalLinkResponse) => {
    setEditingLink(link);
    form.setFieldsValue({
      name: link.name,
      url: link.url,
      description: link.description || '',
      category: link.category || undefined,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload: ExternalLinkPayload = {
        name: values.name,
        url: values.url,
        description: values.description || undefined,
        category: values.category || undefined,
      };

      if (editingLink) {
        await ExternalLinkService.update(editingLink.id, payload);
        notification.success({ message: 'Link updated' });
      } else {
        await ExternalLinkService.create(payload);
        notification.success({ message: 'Link registered' });
      }

      setModalOpen(false);
      fetchLinks();
    } catch (e: any) {
      if (e?.errorFields) return;
      notification.error({ message: 'Failed to save link' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ExternalLinkService.delete(id);
      notification.success({ message: 'Link removed' });
      fetchLinks();
    } catch {
      notification.error({ message: 'Failed to delete link' });
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      sorter: true,
      ellipsis: true,
      render: (url: string) => (
        <Text copyable style={{ fontSize: 12, fontFamily: 'monospace' }}>
          {url}
        </Text>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (cat: string | null) =>
        cat ? <Tag color="blue">{cat}</Tag> : <Tag>Uncategorized</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Registered',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: true,
      width: 160,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: ExternalLinkResponse) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            type="text"
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="Remove this link?"
            description="Scripts using this URL will fail validation after removal."
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" type="text" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
            <span>External Links Registry</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Register New Link
          </Button>
        }
      >
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Only URLs registered here (or from your Connections) are allowed in task scripts and
          pipeline code. Any unregistered external URL will be blocked.
        </Paragraph>

        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by name or URL..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 350 }}
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={data.items}
          rowKey="id"
          loading={loading}
          pagination={{
            current: params.page,
            pageSize: params.limit,
            total: data.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={
          <Space>
            <LinkOutlined />
            {editingLink ? 'Edit External Link' : 'Register External Link'}
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText={editingLink ? 'Update' : 'Register'}
        width={520}
      >
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Registered URLs become available for use in task scripts and pipeline code editors.
        </Paragraph>

        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Link Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="e.g., Etherscan API, Slack Webhook" />
          </Form.Item>

          <Form.Item
            name="url"
            label="URL"
            rules={[
              { required: true, message: 'URL is required' },
              { type: 'url', message: 'Must be a valid URL' },
            ]}
          >
            <Input placeholder="https://api.example.com" />
          </Form.Item>

          <Form.Item name="category" label="Category">
            <Select placeholder="Select category" allowClear options={CATEGORIES} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="What is this link used for?" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
