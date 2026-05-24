'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  message,
  Checkbox,
  Space,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { connectionService } from '@/services/connection.service';
import {
  EndpointTemplate,
  IntegrationProvider,
} from '@/types/restConnectionGroup';
import { generateId } from '@/lib/generateId';

const { Title, Text } = Typography;
const TENANT = 'trial_user_001';

export default function NewRestApiGroupPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [templates, setTemplates] = useState<EndpointTemplate[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('binance');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    connectionService.getIntegrationProviders().then(setProviders);
  }, []);

  useEffect(() => {
    const provider = providers.find((p) => p.key === selectedProvider);
    if (provider) {
      form.setFieldsValue({
        base_url: provider.default_base_url,
        auth_type: provider.default_auth_type,
      });
    }
    connectionService.getIntegrationTemplates(selectedProvider).then((t) => {
      setTemplates(t);
      if (selectedProvider === 'binance') {
        setSelectedTemplates(t.map((x: EndpointTemplate) => x.template_key));
      } else {
        setSelectedTemplates([]);
      }
    });
  }, [selectedProvider, providers, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const apiKey = values.api_key as string;
      const payload = {
        name: values.name,
        provider_key: selectedProvider,
        description: values.description,
        base_url: values.base_url,
        auth_type: selectedProvider === 'binance' ? 4 : 0,
        auth_config:
          selectedProvider === 'binance'
            ? { key: 'X-MBX-APIKEY', value: apiKey, addTo: 'header' }
            : {},
        variables: apiKey
          ? [{ uiId: generateId(), key: 'api_key', value: apiKey, enabled: true }]
          : [],
        fetch_settings: { retries: 3, timeout: 30 },
        template_keys: selectedTemplates.length ? selectedTemplates : undefined,
      };
      const group = await connectionService.createRestGroup(payload, TENANT);
      message.success('Group created with endpoints');
      router.push(`/connections/rest-api/groups/${group.id}`);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Failed to create group');
    } finally {
      setSaving(false);
    }
  };

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
        Credentials and base URL are shared by every endpoint in this group.
      </Text>

      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Provider" required>
            <Select
              value={selectedProvider}
              onChange={setSelectedProvider}
              options={providers.map((p) => ({
                value: p.key,
                label: p.name,
              }))}
            />
          </Form.Item>

          <Form.Item name="name" label="Group name" rules={[{ required: true }]}>
            <Input placeholder="Binance Production" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="base_url" label="Base URL" rules={[{ required: true }]}>
            <Input placeholder="https://api.binance.com" />
          </Form.Item>

          {selectedProvider === 'binance' && (
            <Form.Item name="api_key" label="API Key (X-MBX-APIKEY)" rules={[{ required: true }]}>
              <Input.Password placeholder="Your Binance API key" />
            </Form.Item>
          )}

          {templates.length > 0 && (
            <Form.Item label="Endpoint templates to add">
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

          <Button type="primary" htmlType="submit" loading={saving} block>
            Create group
          </Button>
        </Form>
      </Card>
    </div>
  );
}
