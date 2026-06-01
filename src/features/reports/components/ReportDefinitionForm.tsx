'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Typography,
  notification,
} from 'antd';
import { useRouter } from 'next/navigation';
import { ReportLayout, ReportPreset, ReportService } from '@/services/report.service';
import { workspacePath } from '@/lib/paths';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

type Props = {
  workspaceId: number;
  definitionId?: number;
};

const DEFAULT_LAYOUT: ReportLayout = {
  sections: [
    {
      type: 'fields',
      title: 'Summary',
      paths: [
        { label: 'Topic', path: 'topic' },
        { label: 'Generated at', path: 'generated_at' },
      ],
    },
  ],
};

export default function ReportDefinitionForm({ workspaceId, definitionId }: Props) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [presets, setPresets] = useState<ReportPreset[]>([]);
  const [loading, setLoading] = useState(!!definitionId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    ReportService.listPresets().then(setPresets).catch(() => {});
  }, []);

  useEffect(() => {
    if (!definitionId) {
      form.setFieldsValue({
        data_root_path: 'report',
        layout_json: JSON.stringify(DEFAULT_LAYOUT, null, 2),
      });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const def = await ReportService.get(definitionId);
        if (cancelled) return;
        form.setFieldsValue({
          name: def.name,
          description: def.description,
          pipeline_uuid: def.pipeline_uuid,
          data_root_path: def.data_root_path ?? '',
          layout_json: JSON.stringify(def.layout, null, 2),
        });
      } catch {
        notification.error({ message: 'Failed to load report definition' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [definitionId, form]);

  const applyPreset = (key: string) => {
    const preset = presets.find((p) => p.key === key);
    if (!preset) return;
    form.setFieldsValue({
      name: preset.name,
      description: preset.description,
      data_root_path: preset.data_root_path,
      layout_json: JSON.stringify(preset.layout, null, 2),
    });
  };

  const onFinish = async (values: Record<string, string>) => {
    let layout: ReportLayout;
    try {
      layout = JSON.parse(values.layout_json) as ReportLayout;
      if (!Array.isArray(layout.sections)) {
        throw new Error('layout.sections must be an array');
      }
    } catch {
      notification.error({
        message: 'Invalid layout JSON',
        description: 'Layout must be valid JSON with a sections array.',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: values.name,
        description: values.description || undefined,
        pipeline_uuid: values.pipeline_uuid || undefined,
        data_root_path: values.data_root_path ?? '',
        layout,
        workspace_id: workspaceId,
      };
      if (definitionId) {
        await ReportService.update(definitionId, payload);
        notification.success({ message: 'Report updated' });
      } else {
        await ReportService.create(payload);
        notification.success({ message: 'Report created' });
      }
      router.push(workspacePath(workspaceId, 'reports'));
    } catch {
      notification.error({ message: 'Failed to save report' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Card loading />;
  }

  return (
    <div className="p-8" style={{ maxWidth: 900 }}>
      <Title level={2} style={{ marginTop: 0 }}>
        {definitionId ? 'Edit report' : 'New report'}
      </Title>
      <Paragraph type="secondary">
        Define how pipeline run output is rendered. Use dot paths into JSON (e.g.{' '}
        <code>report.narratives</code>). Data is taken from the last successful node, optionally
        under <code>data_root_path</code>.
      </Paragraph>

      {presets.length > 0 && !definitionId && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap>
            <span>Start from preset:</span>
            {presets.map((p) => (
              <Button key={p.key} size="small" onClick={() => applyPreset(p.key)}>
                {p.name}
              </Button>
            ))}
          </Space>
        </Card>
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input placeholder="Narrative analysis report" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <TextArea rows={2} />
        </Form.Item>
        <Form.Item
          name="pipeline_uuid"
          label="Pipeline UUID (optional)"
          extra="Limit this template to runs of a specific pipeline."
        >
          <Input placeholder="Leave empty for any pipeline" />
        </Form.Item>
        <Form.Item
          name="data_root_path"
          label="Data root path"
          extra='Dot path into last node output, e.g. "report". Leave empty to use full output.'
        >
          <Input placeholder="report" />
        </Form.Item>
        <Form.Item
          name="layout_json"
          label="Layout (JSON)"
          rules={[{ required: true }]}
          extra='Sections: fields, table (array_path + columns), key_value (object_path).'
        >
          <TextArea rows={18} style={{ fontFamily: 'monospace', fontSize: 12 }} />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save
          </Button>
          <Button onClick={() => router.push(workspacePath(workspaceId, 'reports'))}>
            Cancel
          </Button>
        </Space>
      </Form>
    </div>
  );
}
