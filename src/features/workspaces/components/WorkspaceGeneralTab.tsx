'use client';

import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Select, notification } from 'antd';
import { WorkspaceItem, WorkspaceService } from '@/services/workspace.service';
import { COMMON_TIMEZONES } from '@/constants/timezones';

type Props = {
  workspace: WorkspaceItem;
  onUpdated: (ws: WorkspaceItem) => void;
};

export default function WorkspaceGeneralTab({ workspace, onUpdated }: Props) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      name: workspace.name,
      description: workspace.description || '',
      timezone: workspace.timezone || 'UTC',
    });
  }, [workspace, form]);

  const onFinish = async (values: {
    name: string;
    description?: string;
    timezone: string;
  }) => {
    try {
      setSaving(true);
      const updated = await WorkspaceService.update(workspace.id, values);
      onUpdated(updated);
      notification.success({ message: 'Workspace settings saved' });
    } catch {
      notification.error({ message: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 480 }}>
      <Form.Item name="name" label="Workspace name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Description">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="timezone" label="Timezone" rules={[{ required: true }]}>
        <Select
          showSearch
          options={COMMON_TIMEZONES.map((tz) => ({ label: tz, value: tz }))}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving}>
          Save changes
        </Button>
      </Form.Item>
    </Form>
  );
}
