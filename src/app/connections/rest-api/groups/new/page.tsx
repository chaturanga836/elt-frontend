'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { connectionService } from '@/services/connection.service';
import {
  EndpointTemplate,
  IntegrationProvider,
} from '@/types/restConnectionGroup';
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

interface VarRow {
  uiId: string;
  key: string;
  value: string;
}

export default function NewRestApiGroupPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [authType, setAuthType] = useState(0);
  const [variables, setVariables] = useState<VarRow[]>([
    { uiId: generateId(), key: '', value: '' },
  ]);

  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [templates, setTemplates] = useState<EndpointTemplate[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('custom');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  useEffect(() => {
    connectionService.getIntegrationProviders().then(setProviders);
  }, []);

  useEffect(() => {
    if (selectedProvider === 'custom') {
      setTemplates([]);
      setSelectedTemplates([]);
      return;
    }
    const provider = providers.find((p) => p.key === selectedProvider);
    if (provider) {
      form.setFieldsValue({
        base_url: provider.default_base_url,
      });
      setAuthType(provider.default_auth_type);
      if (provider.default_variables?.length) {
        setVariables(
          provider.default_variables.map((v) => ({
            uiId: generateId(),
            key: v.key,
            value: v.value,
          })),
        );
      }
    }
    connectionService.getIntegrationTemplates(selectedProvider).then((t) => {
      setTemplates(t);
      setSelectedTemplates(t.map((x: EndpointTemplate) => x.template_key));
    });
  }, [selectedProvider, providers, form]);

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

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        provider_key: selectedProvider,
        description: values.description || '',
        base_url: values.base_url,
        auth_type: authType,
        auth_config: buildAuthConfig(values),
        variables: variables
          .filter((v) => v.key)
          .map((v) => ({ uiId: v.uiId, key: v.key, value: v.value, enabled: true })),
        fetch_settings: { retries: 3, timeout: 30 },
        template_keys: selectedTemplates.length ? selectedTemplates : undefined,
      };
      const group = await connectionService.createRestGroup(payload, TENANT);
      message.success('Group created');
      router.push(`/connections/rest-api/groups/${group.id}`);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Failed to create group');
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

  return (
    <div className="p-8 max-w-2xl">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        className="px-0 mb-4"
        onClick={() => router.push('/connections/rest-api/groups')}
      >
        Back
      </Button>

      <Title level={3}>New REST API Group</Title>
      <Text type="secondary" className="block mb-6">
        Base URL, credentials, and variables are shared by every endpoint in this group.
        Endpoints can override these defaults.
      </Text>

      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Group Name" rules={[{ required: true }]}>
            <Input placeholder="Etherscan Production" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Etherscan blockchain explorer API" />
          </Form.Item>

          <Form.Item name="base_url" label="Base URL" rules={[{ required: true }]}>
            <Input placeholder="https://api.etherscan.io" />
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
                  <Input placeholder="Header / param name (e.g. X-API-KEY)" />
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
            className="mb-4"
          >
            Add Variable
          </Button>

          {providers.length > 0 && (
            <Collapse
              ghost
              className="mb-4"
              items={[
                {
                  key: 'provider',
                  label: (
                    <Text type="secondary" className="text-xs">
                      Pre-fill from provider template (optional)
                    </Text>
                  ),
                  children: (
                    <>
                      <Form.Item label="Provider">
                        <Select
                          value={selectedProvider}
                          onChange={setSelectedProvider}
                          options={[
                            { value: 'custom', label: 'Custom (no template)' },
                            ...providers.map((p) => ({
                              value: p.key,
                              label: p.name,
                            })),
                          ]}
                        />
                      </Form.Item>
                      {templates.length > 0 && (
                        <Form.Item label="Endpoint templates to seed">
                          <Checkbox.Group
                            value={selectedTemplates}
                            onChange={(vals) => setSelectedTemplates(vals as string[])}
                            className="flex flex-col gap-2"
                          >
                            {templates.map((t) => (
                              <Checkbox key={t.template_key} value={t.template_key}>
                                <Space direction="vertical" size={0}>
                                  <Text strong>{t.name}</Text>
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    {t.method === 1 ? 'GET' : 'POST'} {t.path}
                                  </Text>
                                </Space>
                              </Checkbox>
                            ))}
                          </Checkbox.Group>
                        </Form.Item>
                      )}
                    </>
                  ),
                },
              ]}
            />
          )}

          <Button type="primary" htmlType="submit" loading={saving} block>
            Create Group
          </Button>
        </Form>
      </Card>
    </div>
  );
}
