'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Flex, Form, Input, Space, Spin, Typography, notification } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import {
  WorkspaceDatabaseEngine,
  WorkspaceDatabaseEngineInfo,
  WorkspaceDatabaseService,
  WorkspaceDatabaseStatus,
} from '@/services/workspaceDatabase.service';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text, Paragraph } = Typography;

const NAME_PATTERN = /^[a-z][a-z0-9_]{0,62}$/;

type Step = 'intro' | 'engine' | 'name';

type Props = {
  workspaceId: number;
  onProvisioned: (status: WorkspaceDatabaseStatus) => void;
  mode?: 'initial' | 'add';
  existingNames?: string[];
  onCancel?: () => void;
};

export default function WorkspaceDatabaseSetup({
  workspaceId,
  onProvisioned,
  mode = 'initial',
  existingNames = [],
  onCancel,
}: Props) {
  const [step, setStep] = useState<Step>(mode === 'add' ? 'engine' : 'intro');
  const [engines, setEngines] = useState<WorkspaceDatabaseEngineInfo[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedEngine, setSelectedEngine] = useState<WorkspaceDatabaseEngine | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<{ name: string }>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const catalog = await WorkspaceDatabaseService.getCatalog();
        if (!cancelled) setEngines(catalog.engines);
      } catch (err) {
        if (!cancelled) {
          notification.error({ message: 'Failed to load database options', description: getApiErrorMessage(err) });
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmitName = async (values: { name: string }) => {
    if (!selectedEngine) return;
    const name = values.name.trim().toLowerCase();
    setSubmitting(true);
    try {
      const status = await WorkspaceDatabaseService.create(workspaceId, {
        engine: selectedEngine,
        name,
      });
      notification.success({ message: 'Database created', description: `${selectedEngine} · ${status.name}` });
      onProvisioned(status);
    } catch (err) {
      notification.error({ message: 'Could not create database', description: getApiErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  if (catalogLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 360 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (step === 'intro') {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 360 }}>
        <Space direction="vertical" align="center" size="large">
          <DatabaseOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ margin: 0 }}>
            No database yet
          </Title>
          <Paragraph type="secondary" style={{ textAlign: 'center', maxWidth: 420, margin: 0 }}>
            Create a database for this project to use the SQL editor and table builder.
          </Paragraph>
          <Button type="primary" size="large" onClick={() => setStep('engine')}>
            Create database
          </Button>
        </Space>
      </Flex>
    );
  }

  const minHeight = mode === 'add' ? 280 : 360;
  const nameRules = [
    { required: true, message: 'Enter a database name' },
    {
      pattern: NAME_PATTERN,
      message: 'Use lowercase letters, digits, underscores; start with a letter',
    },
    ...(existingNames.length > 0
      ? [
          {
            validator: (_: unknown, value: string) => {
              const normalized = (value || '').trim().toLowerCase();
              if (normalized && existingNames.includes(normalized)) {
                return Promise.reject(new Error(`"${normalized}" already exists in this project`));
              }
              return Promise.resolve();
            },
          },
        ]
      : []),
  ];

  if (step === 'engine') {
    return (
      <Flex align="center" justify="center" style={{ minHeight }}>
        <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 520 }}>
          <div>
            <Title level={4} style={{ marginBottom: 4 }}>
              Choose database engine
            </Title>
            <Text type="secondary">
              {mode === 'add' && existingNames.length > 0
                ? `Existing: ${existingNames.join(', ')}. Pick the engine for the new schema.`
                : 'One engine type per database. You can create multiple databases (schemas) per engine.'}
            </Text>
          </div>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {engines.map((engine) => (
              <Card
                key={engine.key}
                hoverable={engine.available}
                style={{
                  opacity: engine.available ? 1 : 0.55,
                  cursor: engine.available ? 'pointer' : 'not-allowed',
                  borderColor: selectedEngine === engine.key ? '#1677ff' : undefined,
                }}
                onClick={() => {
                  if (!engine.available) return;
                  setSelectedEngine(engine.key);
                  setStep('name');
                }}
              >
                <Flex justify="space-between" align="center">
                  <div>
                    <Text strong>{engine.label}</Text>
                    {!engine.available && (
                      <div>
                        <Text type="secondary">Coming soon</Text>
                      </div>
                    )}
                  </div>
                  {engine.available && <Button type="link">Select</Button>}
                </Flex>
              </Card>
            ))}
          </Space>
          <Flex justify="space-between">
            {mode === 'add' ? (
              <Button onClick={onCancel}>Cancel</Button>
            ) : (
              <Button onClick={() => setStep('intro')}>Back</Button>
            )}
          </Flex>
        </Space>
      </Flex>
    );
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight }}>
      <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 420 }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>
            Name your database
          </Title>
          <Text type="secondary">
            {mode === 'add'
              ? 'Stored as a schema in your project PostgreSQL container. Names must be unique.'
              : 'One service container per engine per project. Additional PostgreSQL databases are schemas inside that container.'}
          </Text>
        </div>
        <Form form={form} layout="vertical" onFinish={onSubmitName}>
          <Form.Item name="name" label="Database name" rules={nameRules}>
            <Input placeholder={mode === 'add' ? 'billing' : 'myapp'} autoFocus />
          </Form.Item>
          <Flex justify="space-between">
            <Button onClick={() => setStep('engine')}>Back</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {mode === 'add' ? 'Create' : 'Next'}
            </Button>
          </Flex>
        </Form>
      </Space>
    </Flex>
  );
}
