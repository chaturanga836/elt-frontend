'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Empty,
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
  FolderAddOutlined,
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
  provisionWorkspaceStorage,
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

function isStorageReady(status: WorkspaceStorageStatus | null): boolean {
  return status?.status === 'ready';
}

function canCreateBucket(status: WorkspaceStorageStatus | null): boolean {
  if (!status) return true;
  if (status.can_provision) return true;
  return ['not_provisioned', 'error', 'unknown'].includes(status.status);
}

export default function StorageBrowserPage({ workspaceId }: Props) {
  const [storage, setStorage] = useState<WorkspaceStorageStatus | null>(null);
  const [objects, setObjects] = useState<StorageObjectItem[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [objectsUnavailable, setObjectsUnavailable] = useState(false);

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
      setObjectsUnavailable(false);
    },
    [workspaceId, currentPrefix],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const status = await loadStorage();
      if (isStorageReady(status)) {
        try {
          await loadObjects(currentPrefix);
        } catch (err) {
          const message = getApiErrorMessage(err, 'Failed to load objects');
          if (message.toLowerCase().includes('not ready')) {
            setObjectsUnavailable(true);
            setObjects([]);
          } else {
            notification.error({ message });
          }
        }
      } else {
        setObjects([]);
        setObjectsUnavailable(false);
      }
    } catch (err) {
      notification.error({ message: getApiErrorMessage(err, 'Failed to load storage') });
    } finally {
      setLoading(false);
    }
  }, [loadStorage, loadObjects, currentPrefix]);

  const handleCreateBucket = useCallback(async () => {
    setProvisioning(true);
    try {
      const status = await provisionWorkspaceStorage(workspaceId);
      setStorage(status);
      setObjectsUnavailable(false);
      if (isStorageReady(status)) {
        notification.success({ message: 'Bucket created successfully' });
        await loadObjects('');
      } else {
        notification.error({
          message: status.error ?? 'Bucket creation failed',
        });
      }
    } catch (err) {
      notification.error({ message: getApiErrorMessage(err, 'Failed to create bucket') });
    } finally {
      setProvisioning(false);
    }
  }, [workspaceId, loadObjects]);

  useEffect(() => {
    refresh();
  }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const showCreateBucket = canCreateBucket(storage) || objectsUnavailable;

  const createBucketButton = (
    <Button
      type="primary"
      icon={<FolderAddOutlined />}
      loading={provisioning}
      onClick={() => handleCreateBucket()}
    >
      {storage?.status === 'error' ? 'Retry create bucket' : 'Create bucket'}
    </Button>
  );

  if (loading && !storage) {
    return (
      <div style={{ padding: 24 }}>
        <Spin />
      </div>
    );
  }

  if (showCreateBucket && !isStorageReady(storage)) {
    const isError = storage?.status === 'error';
    return (
      <div style={{ padding: 24 }}>
        <Title level={3} style={{ marginTop: 0 }}>
          Storage
        </Title>
        <Text type="secondary">Managed MinIO object storage for this project.</Text>
        <Card style={{ marginTop: 16 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              isError
                ? storage?.error ?? 'Bucket provisioning failed'
                : 'No storage bucket exists for this project yet.'
            }
          >
            {createBucketButton}
          </Empty>
        </Card>
      </div>
    );
  }

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

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Storage
      </Title>
      <Text type="secondary">Managed MinIO object storage for this project.</Text>

      {objectsUnavailable ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message="Storage bucket is not ready"
          description="Create a bucket to start uploading files."
          action={createBucketButton}
        />
      ) : null}

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
            {showCreateBucket ? createBucketButton : null}
            <Button icon={<ReloadOutlined />} onClick={() => refresh()}>
              Refresh
            </Button>
            <Upload
              showUploadList={false}
              disabled={showCreateBucket}
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
              <Button icon={<CloudUploadOutlined />} loading={uploading} disabled={showCreateBucket}>
                Upload
              </Button>
            </Upload>
          </Space>
        </Space>

        <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 12 }} />

        <Spin spinning={loading}>
          {showCreateBucket && objects.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Bucket not provisioned yet"
              style={{ margin: '32px 0' }}
            >
              {createBucketButton}
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={objects}
              rowKey="key"
              pagination={false}
              size="middle"
              locale={{ emptyText: 'No objects in this folder' }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
}
