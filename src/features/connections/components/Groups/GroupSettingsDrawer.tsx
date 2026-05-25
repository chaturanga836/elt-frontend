'use client';

import { useEffect, useState } from 'react';
import { Button, Divider, Drawer, Form, Input, message } from 'antd';
import { connectionService } from '@/services/connection.service';
import { RestConnectionGroupDetail } from '@/types/restConnectionGroup';
import { generateId } from '@/lib/generateId';
import AuthFields, { buildAuthConfig } from './AuthFields';
import VariablesEditor, { VarRow, createEmptyVar } from './VariablesEditor';

const TENANT = 'trial_user_001';

interface GroupSettingsDrawerProps {
  group: RestConnectionGroupDetail;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function GroupSettingsDrawer({
  group,
  open,
  onClose,
  onSaved,
}: GroupSettingsDrawerProps) {
  const [form] = Form.useForm();
  const [authType, setAuthType] = useState(0);
  const [variables, setVariables] = useState<VarRow[]>([createEmptyVar()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !group) return;
    form.setFieldsValue({
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
        : [createEmptyVar()],
    );
  }, [open, group, form]);

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        name: values.name,
        description: values.description || '',
        base_url: values.base_url,
        auth_type: authType,
        auth_config: buildAuthConfig(authType, values),
        variables: variables
          .filter((v) => v.key)
          .map((v) => ({ uiId: v.uiId, key: v.key, value: v.value, enabled: true })),
      };
      await connectionService.updateRestGroup(group.id, payload, TENANT);
      message.success('Group updated');
      onClose();
      onSaved();
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Group Settings"
      width={520}
      open={open}
      onClose={onClose}
      extra={
        <Button type="primary" onClick={onSave} loading={saving}>
          Save
        </Button>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Group Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="base_url" label="Base URL" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Divider titlePlacement="left" plain>
          Authentication
        </Divider>
        <AuthFields authType={authType} onAuthTypeChange={setAuthType} />

        <Divider titlePlacement="left" plain>
          Variables
        </Divider>
        <VariablesEditor variables={variables} onChange={setVariables} />
      </Form>
    </Drawer>
  );
}
