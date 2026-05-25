'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Divider,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { connectionService } from '@/services/connection.service';
import { RestConnectionGroupDetail } from '@/types/restConnectionGroup';
import { useConnectionStore } from '@/store/useConnectionStore';
import { generateId } from '@/lib/generateId';

const { Title, Text } = Typography;
const TENANT = 'trial_user_001';

const AUTH_OPTIONS = [
  { value: 0, label: 'No Authentication' },
  { value: 1, label: 'Basic Auth' },
  { value: 2, label: 'Bearer Token' },
  { value: 3, label: 'JWT Bearer' },
  { value: 4, label: 'API Key' },
  { value: 5, label: 'OAuth 2.0' },
];

const AUTH_LABELS: Record<number, string> = {
  0: 'None',
  1: 'Basic Auth',
  2: 'Bearer Token',
  3: 'JWT Bearer',
  4: 'API Key',
  5: 'OAuth 2.0',
};

interface VarRow {
  uiId: string;
  key: string;
  value: string;
}

export default function RestApiGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = Number(params.groupId);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<RestConnectionGroupDetail | null>(null);
  const setGroupContext = useConnectionStore((s) => s.setGroupContext);
  const loadFromEndpoint = useConnectionStore((s) => s.loadFromEndpoint);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerForm] = Form.useForm();
  const [authType, setAuthType] = useState(0);
  const [variables, setVariables] = useState<VarRow[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await connectionService.getRestGroup(groupId, TENANT);
      setGroup(data);
      setGroupContext(groupId, data.name);
    } catch {
      message.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) load();
    return () => setGroupContext(null, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const openDrawer = () => {
    if (!group) return;
    drawerForm.setFieldsValue({
      name: group.name,
      description: group.description || '',
      base_url: group.base_url,
      auth_username: group.auth_config?.username || '',
      auth_password: group.auth_config?.password || '',
      auth_token: group.auth_config?.token || '',
      auth_jwt_token: group.auth_config?.token || '',
      auth_apikey_key: group.auth_config?.key || '',
      auth_apikey_value: group.auth_config?.value || '',
      auth_apikey_addto: group.auth_config?.addTo || 'header',
      auth_client_id: group.auth_config?.client_id || '',
      auth_client_secret: group.auth_config?.client_secret || '',
      auth_token_url: group.auth_config?.token_url || '',
    });
    setAuthType(group.auth_type);
    const vars = (group.variables as Array<{ uiId?: string; key: string; value: string }>) || [];
    setVariables(
      vars.length
        ? vars.map((v) => ({ uiId: v.uiId || generateId(), key: v.key, value: v.value }))
        : [{ uiId: generateId(), key: '', value: '' }],
    );
    setDrawerOpen(true);
  };

  const buildAuthConfig = (values: Record<string, unknown>) => {
    switch (authType) {
      case 1:
        return { username: values.auth_username || '', password: values.auth_password || '' };
      case 2:
        return { token: values.auth_token || '' };
      case 3:
        return { token: values.auth_jwt_token || '' };
      case 4:
        return {
          key: values.auth_apikey_key || '',
          value: values.auth_apikey_value || '',
          addTo: values.auth_apikey_addto || 'header',
        };
      case 5:
        return {
          client_id: values.auth_client_id || '',
          client_secret: values.auth_client_secret || '',
          token_url: values.auth_token_url || '',
        };
      default:
        return {};
    }
  };

  const onDrawerSave = async () => {
    try {
      const values = await drawerForm.validateFields();
      setSaving(true);
      const payload = {
        name: values.name,
        description: values.description || '',
        base_url: values.base_url,
        auth_type: authType,
        auth_config: buildAuthConfig(values),
        variables: variables
          .filter((v) => v.key)
          .map((v) => ({ uiId: v.uiId, key: v.key, value: v.value, enabled: true })),
      };
      await connectionService.updateRestGroup(groupId, payload, TENANT);
      message.success('Group updated');
      setDrawerOpen(false);
      load();
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  const addVariable = () =>
    setVariables((prev) => [...prev, { uiId: generateId(), key: '', value: '' }]);

  const removeVariable = (uiId: string) =>
    setVariables((prev) => prev.filter((v) => v.uiId !== uiId));

  const updateVariable = (uiId: string, field: 'key' | 'value', val: string) =>
    setVariables((prev) =>
      prev.map((v) => (v.uiId === uiId ? { ...v, [field]: val } : v)),
    );

  if (loading || !group) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Method',
      dataIndex: 'method',
      width: 80,
      render: (m: number) => {
        const labels: Record<number, string> = { 1: 'GET', 2: 'POST', 3: 'PUT', 4: 'DELETE' };
        return <Tag>{labels[m] || m}</Tag>;
      },
    },
    { title: 'Path', dataIndex: 'path', key: 'path' },
    {
      title: 'Full URL',
      dataIndex: 'effective_url',
      ellipsis: true,
      render: (url: string) => (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {url}
        </Text>
      ),
    },
    {
      title: '',
      key: 'edit',
      width: 80,
      render: (_: unknown, row: { id: number }) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => {
            const ep = group.endpoints.find((e) => e.id === row.id);
            if (ep) {
              loadFromEndpoint(ep as Record<string, unknown>);
              setGroupContext(groupId, group.name);
              router.push(`/connections/rest-api/${row.id}/edit`);
            }
          }}
        />
      ),
    },
  ];

  const groupVars = (group.variables as Array<{ key: string; value: string }>) || [];

  return (
    <div className="p-8">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        className="px-0 mb-4"
        onClick={() => router.push('/connections/rest-api/groups')}
      >
        Back to groups
      </Button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            {group.name}
          </Title>
          <Space className="mt-2" wrap>
            <Tag>{group.provider_key}</Tag>
            <Text type="secondary">{group.base_url}</Text>
            <Tag color="blue">{AUTH_LABELS[group.auth_type] || 'None'}</Tag>
            {groupVars.length > 0 && (
              <Tag color="green">{groupVars.length} variable{groupVars.length > 1 ? 's' : ''}</Tag>
            )}
          </Space>
        </div>
        <Button icon={<SettingOutlined />} onClick={openDrawer}>
          Group Settings
        </Button>
      </div>

      <Card title={`Endpoints (${group.endpoints.length})`}>
        <Table
          rowKey="id"
          dataSource={group.endpoints}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Card>

      <Drawer
        title="Group Settings"
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button type="primary" onClick={onDrawerSave} loading={saving}>
            Save
          </Button>
        }
      >
        <Form form={drawerForm} layout="vertical">
          <Form.Item name="name" label="Group Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="base_url" label="Base URL" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Divider orientation="left" plain>
            Authentication
          </Divider>

          <Form.Item label="Auth Type">
            <Select
              value={authType}
              onChange={(val) => setAuthType(val)}
              options={AUTH_OPTIONS}
            />
          </Form.Item>

          {authType === 1 && (
            <Space.Compact className="w-full">
              <Form.Item name="auth_username" className="flex-1 mb-3" rules={[{ required: true }]}>
                <Input placeholder="Username" />
              </Form.Item>
              <Form.Item name="auth_password" className="flex-1 mb-3" rules={[{ required: true }]}>
                <Input.Password placeholder="Password" />
              </Form.Item>
            </Space.Compact>
          )}

          {authType === 2 && (
            <Form.Item name="auth_token" label="Token" rules={[{ required: true }]}>
              <Input.Password placeholder="Bearer token" />
            </Form.Item>
          )}

          {authType === 3 && (
            <Form.Item name="auth_jwt_token" label="JWT Token" rules={[{ required: true }]}>
              <Input.Password placeholder="JWT token or secret" />
            </Form.Item>
          )}

          {authType === 4 && (
            <>
              <Space.Compact className="w-full">
                <Form.Item name="auth_apikey_key" className="flex-1 mb-3" rules={[{ required: true }]}>
                  <Input placeholder="Header / param name" />
                </Form.Item>
                <Form.Item name="auth_apikey_value" className="flex-1 mb-3" rules={[{ required: true }]}>
                  <Input.Password placeholder="API key value" />
                </Form.Item>
              </Space.Compact>
              <Form.Item name="auth_apikey_addto" label="Add to" initialValue="header">
                <Select
                  options={[
                    { value: 'header', label: 'Header' },
                    { value: 'query', label: 'Query Parameter' },
                  ]}
                />
              </Form.Item>
            </>
          )}

          {authType === 5 && (
            <>
              <Form.Item name="auth_client_id" label="Client ID" rules={[{ required: true }]}>
                <Input placeholder="Client ID" />
              </Form.Item>
              <Form.Item name="auth_client_secret" label="Client Secret" rules={[{ required: true }]}>
                <Input.Password placeholder="Client Secret" />
              </Form.Item>
              <Form.Item name="auth_token_url" label="Token URL" rules={[{ required: true }]}>
                <Input placeholder="https://auth.example.com/oauth/token" />
              </Form.Item>
            </>
          )}

          <Divider orientation="left" plain>
            Variables
          </Divider>
          <Text type="secondary" className="block mb-3 text-xs">
            Shared variables available to all endpoints via {'{{variable_name}}'} syntax.
            Endpoints can override these.
          </Text>
          {variables.map((v) => (
            <div key={v.uiId} className="flex gap-2 mb-2">
              <Input
                placeholder="key"
                value={v.key}
                onChange={(e) => updateVariable(v.uiId, 'key', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="value"
                value={v.value}
                onChange={(e) => updateVariable(v.uiId, 'value', e.target.value)}
                className="flex-1"
              />
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                onClick={() => removeVariable(v.uiId)}
                disabled={variables.length === 1}
              />
            </div>
          ))}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addVariable}
            size="small"
          >
            Add Variable
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}
