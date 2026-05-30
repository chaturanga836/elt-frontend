'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, SettingOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';
import { connectionService } from '@/services/connection.service';
import {
  EndpointTemplate,
  IntegrationProvider,
} from '@/types/restConnectionGroup';
import { generateId } from '@/lib/generateId';
import AuthFields, { buildAuthConfig } from './AuthFields';
import VariablesEditor, { VarRow, createEmptyVar } from './VariablesEditor';

const { Title, Text } = Typography;

export default function GroupCreateForm() {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [authType, setAuthType] = useState(0);
  const [variables, setVariables] = useState<VarRow[]>([createEmptyVar()]);
  const [varsDrawerOpen, setVarsDrawerOpen] = useState(false);

  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [templates, setTemplates] = useState<EndpointTemplate[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('custom');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  useEffect(() => {
    connectionService.getIntegrationProviders(workspaceId).then(setProviders);
  }, [workspaceId]);

  useEffect(() => {
    if (selectedProvider === 'custom') {
      setTemplates([]);
      setSelectedTemplates([]);
      return;
    }
    const provider = providers.find((p) => p.key === selectedProvider);
    if (provider) {
      form.setFieldsValue({ base_url: provider.default_base_url });
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
    connectionService.getIntegrationTemplates(selectedProvider, workspaceId).then((t) => {
      setTemplates(t);
      setSelectedTemplates(t.map((x: EndpointTemplate) => x.template_key));
    });
  }, [selectedProvider, providers, form, workspaceId]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        provider_key: selectedProvider,
        description: values.description || '',
        base_url: values.base_url,
        auth_type: authType,
        auth_config: buildAuthConfig(authType, values),
        variables: variables
          .filter((v) => v.key)
          .map((v) => ({ uiId: v.uiId, key: v.key, value: v.value, enabled: true })),
        fetch_settings: { retries: 3, timeout: 30 },
        template_keys: selectedTemplates.length ? selectedTemplates : undefined,
      };
      const group = await connectionService.createRestGroup(payload, workspaceId);
      message.success('Group created');
      router.push(workspacePath(workspaceId, `connections/rest-api/groups/${group.id}`));
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
        onClick={() => router.push(workspacePath(workspaceId, 'connections/rest-api/groups'))}
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

          <Divider titlePlacement="left" plain>
            Authentication
          </Divider>
          <AuthFields authType={authType} onAuthTypeChange={setAuthType} />

          <Divider titlePlacement="left" plain>
            Variables
          </Divider>
          <Badge count={variables.filter((v) => v.key).length} size="small" offset={[8, 0]}>
            <Button icon={<SettingOutlined />} onClick={() => setVarsDrawerOpen(true)}>
              Manage Variables
            </Button>
          </Badge>

          {providers.length > 0 && (
            <Collapse
              ghost
              className="mb-4 mt-4"
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
                                <Space orientation ="vertical" size={0}>
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

          <Button type="primary" htmlType="submit" loading={saving} block className="mt-4">
            Create Group
          </Button>
        </Form>
      </Card>

      <Drawer
        title="Group Variables"
        width={480}
        open={varsDrawerOpen}
        onClose={() => setVarsDrawerOpen(false)}
        extra={
          <Button type="primary" onClick={() => setVarsDrawerOpen(false)}>
            Done
          </Button>
        }
      >
        <VariablesEditor variables={variables} onChange={setVariables} />
      </Drawer>
    </div>
  );
}
