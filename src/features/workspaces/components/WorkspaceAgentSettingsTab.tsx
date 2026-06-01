'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Divider,
  AutoComplete,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
  notification,
} from 'antd';
import {
  AgentDatabaseTypeInfo,
  AgentSettingsUpdate,
  WorkspaceAgentSettingsService,
} from '@/services/workspaceAgentSettings.service';

const { Paragraph, Text } = Typography;

type Props = {
  workspaceId: number;
};

export default function WorkspaceAgentSettingsTab({ workspaceId }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [catalog, setCatalog] = useState<{ providers: string[]; models: Record<string, string[]> }>({
    providers: ['openai', 'anthropic', 'ollama', 'custom'],
    models: {},
  });
  const [dbTypes, setDbTypes] = useState<AgentDatabaseTypeInfo[]>([]);
  const [configured, setConfigured] = useState(false);
  const [provider, setProvider] = useState('openai');
  const dbType = Form.useWatch('db_type', form) || 'postgres';

  const selectedDbMeta = dbTypes.find((t) => t.key === dbType) || dbTypes[0];

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [llmCat, dbCat, settings] = await Promise.all([
        WorkspaceAgentSettingsService.getLlmCatalog(),
        WorkspaceAgentSettingsService.getDatabaseCatalog(),
        WorkspaceAgentSettingsService.get(workspaceId),
      ]);
      setCatalog({ providers: llmCat.providers, models: llmCat.suggested_models });
      setDbTypes(dbCat.types);
      setConfigured(settings.configured);
      setProvider(settings.llm.provider);
      form.setFieldsValue({
        llm_provider: settings.llm.provider,
        llm_model: settings.llm.model,
        llm_api_key: '',
        llm_api_key_hint: settings.llm.api_key || '',
        llm_base_url: settings.llm.base_url || '',
        db_enabled: settings.database.enabled,
        db_type: settings.database.db_type || 'postgres',
        db_host: settings.database.host,
        db_port: settings.database.port,
        db_name: settings.database.database,
        db_username: settings.database.username,
        db_password: '',
        db_password_hint: settings.database.password || '',
        db_ssl_mode: settings.database.ssl_mode,
        db_auth_source: settings.database.auth_source || 'admin',
      });
    } catch {
      notification.error({ message: 'Failed to load agent settings' });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, form]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDbTypeChange = (type: string) => {
    const meta = dbTypes.find((t) => t.key === type);
    if (meta) {
      form.setFieldValue('db_port', meta.default_port);
    }
  };

  const buildPayload = (): AgentSettingsUpdate => {
    const v = form.getFieldsValue();
    return {
      llm: {
        provider: v.llm_provider,
        model: Array.isArray(v.llm_model) ? v.llm_model[0] : String(v.llm_model || ''),
        api_key: v.llm_api_key || undefined,
        base_url: v.llm_base_url || undefined,
      },
      database: {
        enabled: v.db_enabled,
        db_type: v.db_type || 'postgres',
        host: v.db_host || '',
        port: v.db_port ?? selectedDbMeta?.default_port ?? 5432,
        database: v.db_name || '',
        username: v.db_username || '',
        password: v.db_password || undefined,
        ssl_mode: v.db_ssl_mode || 'prefer',
        auth_source: v.db_auth_source || 'admin',
      },
    };
  };

  const onSave = async () => {
    try {
      await form.validateFields();
      setSaving(true);
      await WorkspaceAgentSettingsService.update(workspaceId, buildPayload());
      notification.success({ message: 'Agent settings saved' });
      void load();
    } catch {
      notification.error({ message: 'Failed to save agent settings' });
    } finally {
      setSaving(false);
    }
  };

  const onTestDb = async () => {
    try {
      setTesting(true);
      const result = await WorkspaceAgentSettingsService.testDatabase(
        workspaceId,
        buildPayload(),
      );
      if (result.success) {
        notification.success({ message: result.message });
      } else {
        notification.error({ message: result.message });
      }
    } catch {
      notification.error({ message: 'Database test failed' });
    } finally {
      setTesting(false);
    }
  };

  const modelOptions = catalog.models[provider] || [];
  const isMongo = dbType === 'mongodb';

  return (
    <Card loading={loading} bordered={false}>
      <Paragraph type="secondary">
        Configure AI and customer databases (PostgreSQL, MySQL, MongoDB) for agent workflows.
        Platform deployment only needs <Text code>ETL_API_URL</Text> on the agent service.
      </Paragraph>

      <Form form={form} layout="vertical" onFinish={onSave} initialValues={{ db_type: 'postgres' }}>
        <TitleSection title="LLM" />
        <Form.Item name="llm_provider" label="Provider" rules={[{ required: true }]}>
          <Select
            options={catalog.providers.map((p) => ({ value: p, label: p }))}
            onChange={(v) => setProvider(v)}
          />
        </Form.Item>
        <Form.Item
          name="llm_model"
          label="Model"
          rules={[{ required: true }]}
          extra="Pick a suggestion or type any model id."
        >
          <AutoComplete
            options={modelOptions.map((m) => ({ value: m }))}
            placeholder="e.g. gpt-4o-mini"
            filterOption={(input, option) =>
              (option?.value?.toString() || '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item
          name="llm_api_key"
          label="API key"
          extra={
            configured && form.getFieldValue('llm_api_key_hint')
              ? `Saved: ${form.getFieldValue('llm_api_key_hint')} — leave blank to keep`
              : 'Required for OpenAI / Anthropic'
          }
        >
          <Input.Password placeholder="sk-…" autoComplete="off" />
        </Form.Item>
        <Form.Item name="llm_api_key_hint" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="llm_base_url" label="Base URL (optional)">
          <Input placeholder="https://api.openai.com/v1 or http://localhost:11434" />
        </Form.Item>

        <Divider />
        <TitleSection title="Customer database" />
        <Paragraph type="secondary" style={{ marginTop: 0 }}>
          Optional database the AI agent can query (separate from platform metadata).
        </Paragraph>
        <Form.Item name="db_enabled" label="Enable database" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="db_type" label="Database type" rules={[{ required: true }]}>
          <Select
            options={dbTypes.map((t) => ({ value: t.key, label: t.label }))}
            onChange={onDbTypeChange}
          />
        </Form.Item>
        <Form.Item name="db_host" label="Host" rules={[{ required: true }]}>
          <Input placeholder="db.customer.example.com" />
        </Form.Item>
        <Form.Item name="db_port" label="Port" rules={[{ required: true }]}>
          <InputNumber min={1} max={65535} style={{ width: 160 }} />
        </Form.Item>
        <Form.Item
          name="db_name"
          label={selectedDbMeta?.database_label || 'Database name'}
          rules={[{ required: true }]}
        >
          <Input placeholder={isMongo ? 'my_app_db' : 'analytics'} />
        </Form.Item>
        <Form.Item
          name="db_username"
          label="Username"
          rules={isMongo ? [] : [{ required: true }]}
          extra={isMongo ? 'Optional if MongoDB has no authentication' : undefined}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="db_password"
          label="Password"
          extra={
            configured && form.getFieldValue('db_password_hint')
              ? `Saved: ${form.getFieldValue('db_password_hint')} — leave blank to keep`
              : isMongo
                ? 'Optional without auth'
                : undefined
          }
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="db_password_hint" hidden>
          <Input />
        </Form.Item>
        {isMongo ? (
          <Form.Item
            name="db_auth_source"
            label="Auth source"
            extra="Authentication database (often admin)"
          >
            <Input placeholder="admin" />
          </Form.Item>
        ) : (
          <Form.Item name="db_ssl_mode" label="SSL mode">
            <Select
              options={[
                { value: 'disable', label: 'disable' },
                { value: 'prefer', label: 'prefer' },
                { value: 'require', label: 'require' },
              ]}
            />
          </Form.Item>
        )}
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save settings
            </Button>
            <Button onClick={() => void onTestDb()} loading={testing}>
              Test connection
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}

function TitleSection({ title }: { title: string }) {
  return (
    <Typography.Title level={5} style={{ marginBottom: 16 }}>
      {title}
    </Typography.Title>
  );
}
