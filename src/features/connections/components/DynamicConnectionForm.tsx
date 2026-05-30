'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  message,
  Spin,
} from 'antd';
import { ArrowLeftOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { connectionService } from '@/services/connection.service';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { resolveWorkspacePath } from '@/lib/paths';

const { Title, Text } = Typography;

interface UIFieldSchema {
  name: string;
  label: string;
  ui_type?: string;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  default?: unknown;
  condition?: { field: string; value: string | number };
}

interface DynamicConnectionFormProps {
  categoryId: number;
  prototypeId: string;
  categoryLabel: string;
  connectionId?: number;
  backHref: string;
}

export default function DynamicConnectionForm({
  categoryId,
  prototypeId,
  categoryLabel,
  connectionId,
  backHref,
}: DynamicConnectionFormProps) {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const resolvedBackHref = resolveWorkspacePath(workspaceId, backHref);
  const connectionsHome = resolveWorkspacePath(workspaceId, '/connections');
  const [form] = Form.useForm();
  const [schema, setSchema] = useState<UIFieldSchema[]>([]);
  const [resolvedProto, setResolvedProto] = useState(prototypeId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const watchedValues = Form.useWatch([], form);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let proto = prototypeId;

        if (connectionId) {
          const existing = await connectionService.getGenericConnection(
            connectionId,
            workspaceId,
          );
          proto = existing.prototype_id;
          setResolvedProto(proto);
          form.setFieldsValue({
            name: existing.name,
            description: existing.description,
            ...existing.config,
          });
        }

        const fields = await connectionService.getPrototypeSchema(
          categoryId,
          proto,
        );
        setSchema(fields);

        if (!connectionId) {
          const defaults: Record<string, unknown> = {};
          fields.forEach((f: UIFieldSchema) => {
            if (f.default !== undefined && f.default !== null) {
              defaults[f.name] = f.default;
            }
          });
          form.setFieldsValue(defaults);
        }
      } catch {
        message.error('Failed to load connection form');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [categoryId, prototypeId, connectionId, workspaceId, form]);

  const visibleFields = schema.filter((field) => {
    if (!field.condition) return true;
    const current = watchedValues?.[field.condition.field];
    return current === field.condition.value;
  });

  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      const { config } = splitFormValues(values);
      const result = await connectionService.testGenericConnection({
        category_id: categoryId,
        prototype_id: resolvedProto,
        config,
      });
      if (result.success) {
        message.success(result.message || 'Connection successful');
      } else {
        message.error(result.message || 'Connection failed');
      }
    } catch {
      message.error('Fix validation errors before testing');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const { name, description, config } = splitFormValues(values);

      if (connectionId) {
        await connectionService.updateGenericConnection(
          connectionId,
          { name, description, config },
          workspaceId,
        );
        message.success('Connection updated');
      } else {
        await connectionService.createGenericConnection(
          {
            name,
            description,
            category_id: categoryId,
            prototype_id: resolvedProto,
            config,
          },
          workspaceId,
        );
        message.success('Connection saved');
      }
      router.push(connectionsHome);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push(resolvedBackHref)}
        className="mb-4 px-0"
      >
        Back
      </Button>

      <Card>
        <Title level={4} style={{ marginTop: 0 }}>
          {connectionId ? 'Edit' : 'New'} {categoryLabel} —{' '}
          {resolvedProto.toUpperCase()}
        </Title>
        <Text type="secondary">Configure and test your connection</Text>

        <Form form={form} layout="vertical" className="mt-6">
          <Form.Item
            name="name"
            label="Connection Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="My Production DB" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>

          {visibleFields.map((field) => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              rules={
                field.required
                  ? [{ required: true, message: `${field.label} is required` }]
                  : undefined
              }
            >
              {renderField(field)}
            </Form.Item>
          ))}

          <div className="flex gap-3 mt-4">
            <Button
              icon={<ThunderboltOutlined />}
              onClick={handleTest}
              loading={testing}
            >
              Test Connection
            </Button>
            <Button type="primary" onClick={handleSave} loading={saving}>
              Save Connection
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

function renderField(field: UIFieldSchema) {
  switch (field.ui_type) {
    case 'password':
      return <Input.Password placeholder={field.placeholder} />;
    case 'number':
      return <InputNumber className="w-full" placeholder={field.placeholder} />;
    case 'textarea':
      return <Input.TextArea rows={4} placeholder={field.placeholder} />;
    case 'select':
      return (
        <Select
          options={field.options}
          placeholder={field.placeholder || 'Select...'}
        />
      );
    default:
      return <Input placeholder={field.placeholder} />;
  }
}

function splitFormValues(values: Record<string, unknown>) {
  const { name, description, ...config } = values;
  return {
    name: String(name),
    description: description ? String(description) : undefined,
    config: config as Record<string, unknown>,
  };
}
