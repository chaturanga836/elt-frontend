'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Card,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Upload,
  notification,
} from 'antd';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  FileOutlined,
  FolderOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { palette } from '@/constants/theme';
import {
  StorageObjectItem,
  WorkspaceStorageStatus,
  deleteStorageObject,
  getWorkspaceStorage,
  listStorageObjects,
  uploadStorageObject,
} from '@/services/storage.service';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text } = Typography;

type Props = {
  workspaceId: number;
};

function formatModified(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function StorageBrowserPage({ workspaceId }: Props) {
  const [storage, setStorage] = useState<WorkspaceStorageStatus | null>(null);
  const [objects, setObjects] = useState<StorageObjectItem[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadStorage = useCallback(async () => {
    const status = await getWorkspaceStorage(workspaceId);
    setStorage(status);
    return status;
  }, [workspaceId]);

  const loadObjects = useCallback(
    async (prefix = currentPrefix) => {
      const result = await listStorageObjects(workspaceId, prefix);
      setObjects(result.items);
      setCurrentPrefix(result.prefix);
    },
    [workspaceId, currentPrefix],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await loadStorage();
      await loadObjects(currentPrefix);
    } catch (err) {
      notification.error({ message: getApiErrorMessage(err, 'Failed to load storage') });
    } finally {
      setLoading(false);
    }
  }, [loadStorage, loadObjects, currentPrefix]);

  useEffect(() => {
    refresh();
  }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const modeLabel = storage?.mode === 'dedicated' ? 'Dedicated' : 'Shared';
  const modeColor = storage?.mode === 'dedicated' ? 'gold' : 'blue';
  const bucket = storage?.bucket ?? '—';

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name: string, row: StorageObjectItem) => (
        <Space>
          {row.type === 'folder' ? <FolderOutlined /> : <FileOutlined />}
          {row.type === 'folder' ? (
            <Button
              type="link"
              style={{ padding: 0, height: 'auto' }}
              onClick={() => {
                const next = row.name.endsWith('/') ? row.name : `${row.name}`;
                loadObjects(next).catch((err) =>
                  notification.error({ message: getApiErrorMessage(err, 'Failed to open folder') }),
                );
              }}
            >
              {name}
            </Button>
          ) : (
            <Text>{name}</Text>
          )}
        </Space>
      ),
    },
    { title: 'Size', dataIndex: 'size', width: 100 },
    {
      title: 'Modified',
      dataIndex: 'modified',
      width: 180,
      render: (v: string | null) => formatModified(v),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 90,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: '',
      width: 60,
      render: (_: unknown, row: StorageObjectItem) =>
        row.type === 'file' ? (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              deleteStorageObject(workspaceId, row.key)
                .then(() => refresh())
                .catch((err) =>
                  notification.error({ message: getApiErrorMessage(err, 'Delete failed') }),
                );
            }}
          />
        ) : null,
    },
  ];

  const breadcrumbItems = [
    { title: bucket },
    ...(currentPrefix
      ? currentPrefix
          .split('/')
          .filter(Boolean)
          .map((part) => ({ title: part }))
      : [{ title: '/' }]),
  ];

  if (storage?.status === 'error') {
    return (
      <div style={{ padding: 24 }}>
        <Title level={3}>Storage</Title>
        <Text type="danger">{storage.error ?? 'Storage provisioning failed'}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Storage
      </Title>
      <Text type="secondary">Managed MinIO object storage for this project.</Text>

      <Card style={{ marginTop: 16 }}>
        <Space wrap style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Tag color={modeColor}>{modeLabel}</Tag>
            {storage?.plan ? <Tag>{storage.plan}</Tag> : null}
            <Text strong>Bucket:</Text>
            <Tag color={palette.accentCyan}>{bucket}</Tag>
            {storage?.mode === 'shared' && storage.prefix ? (
              <Text type="secondary">Prefix: {storage.prefix}</Text>
            ) : null}
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refresh()}>
              Refresh
            </Button>
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                setUploading(true);
                uploadStorageObject(workspaceId, file)
                  .then(() => {
                    notification.success({ message: `Uploaded ${file.name}` });
                    return refresh();
                  })
                  .catch((err) =>
                    notification.error({ message: getApiErrorMessage(err, 'Upload failed') }),
                  )
                  .finally(() => setUploading(false));
                return false;
              }}
            >
              <Button icon={<CloudUploadOutlined />} loading={uploading}>
                Upload
              </Button>
            </Upload>
          </Space>
        </Space>

        <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 12 }} />

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={objects}
            rowKey="key"
            pagination={false}
            size="middle"
          />
        </Spin>
      </Card>
    </div>
  );
}
