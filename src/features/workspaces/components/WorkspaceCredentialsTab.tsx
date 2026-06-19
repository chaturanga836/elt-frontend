'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Input,
  Modal,
  Space,
  Spin,
  Typography,
  message,
  notification,
} from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  ProjectCredentialsCreated,
  ProjectCredentialsMeta,
  StudioService,
} from '@/services/studio.service';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Text, Paragraph } = Typography;

type Props = {
  workspaceId: number;
};

export default function WorkspaceCredentialsTab({ workspaceId }: Props) {
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<ProjectCredentialsMeta | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<ProjectCredentialsCreated | null>(null);

  const loadMeta = useCallback(async () => {
    try {
      setLoading(true);
      const data = await StudioService.getProjectCredentials(workspaceId);
      setMeta(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setMeta(null);
      } else {
        notification.error({
          message: getApiErrorMessage(err, 'Failed to load project credentials'),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success(`${label} copied`);
    } catch {
      message.error('Could not copy to clipboard');
    }
  };

  const onRegenerate = () => {
    Modal.confirm({
      title: meta ? 'Regenerate project secret?' : 'Generate project credentials?',
      content: meta
        ? 'The current secret stops working immediately. Update every app and script that uses these credentials.'
        : 'A new project key and secret will be created. Store the secret securely — it is shown only once.',
      okText: 'Regenerate',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setRegenerating(true);
          const created = await StudioService.regenerateProjectCredentials(workspaceId);
          setRevealedSecret(created);
          await loadMeta();
          notification.success({
            message: 'Credentials regenerated',
            description: 'Copy the new secret now. It will not be shown again.',
          });
        } catch (err: unknown) {
          notification.error({
            message: getApiErrorMessage(err, 'Failed to regenerate credentials'),
          });
        } finally {
          setRegenerating(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spin />
      </div>
    );
  }

  const secretToShow = revealedSecret?.client_secret;
  const keyToShow = revealedSecret?.client_key ?? meta?.client_key;

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="SDK credentials"
        description="Use the project key and secret in @elt/sdk EltPlatformClient or your own HTTP client. The secret is only shown when the project is created or after regeneration."
      />

      <div>
        <Text type="secondary">Project key</Text>
        <Input
          readOnly
          value={keyToShow ?? ''}
          suffix={
            keyToShow ? (
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyText('Project key', keyToShow)}
              />
            ) : null
          }
        />
      </div>

      {meta?.secret_prefix ? (
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Secret prefix: <Text code>{meta.secret_prefix}…</Text>
          {meta.rotated_at ? ` · last rotated ${new Date(meta.rotated_at).toLocaleString()}` : null}
        </Paragraph>
      ) : !meta ? (
        <Alert
          type="info"
          showIcon
          message="No credentials yet"
          description="Generate credentials to connect apps via @elt/sdk."
        />
      ) : null}

      {secretToShow ? (
        <div>
          <Text type="secondary">Project secret (shown once)</Text>
          <Input.Password
            readOnly
            value={secretToShow}
            visibilityToggle
            suffix={
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyText('Project secret', secretToShow)}
              />
            }
          />
        </div>
      ) : (
        <Alert
          type="warning"
          showIcon
          message="Secret not available"
          description="Regenerate credentials to receive a new secret, then store it securely."
        />
      )}

      <Button
        icon={<ReloadOutlined />}
        loading={regenerating}
        onClick={onRegenerate}
      >
        {meta ? 'Regenerate secret' : 'Generate credentials'}
      </Button>
    </Space>
  );
}
