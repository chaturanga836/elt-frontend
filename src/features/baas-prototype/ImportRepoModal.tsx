'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Form, Modal, Select, Spin, Typography, notification } from 'antd';
import {
  GitConnection,
  GitConnectionService,
  GitHubBranchSummary,
  GitHubRepoSummary,
} from '@/services/git-connection.service';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Text } = Typography;

interface ImportRepoModalProps {
  open: boolean;
  connection: GitConnection | null;
  workspaceId: number;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportRepoModal({
  open,
  connection,
  workspaceId,
  onClose,
  onImported,
}: ImportRepoModalProps) {
  const [form] = Form.useForm<{ repo_full_name: string; default_branch: string }>();
  const [repos, setRepos] = useState<GitHubRepoSummary[]>([]);
  const [branches, setBranches] = useState<GitHubBranchSummary[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedRepo = Form.useWatch('repo_full_name', form);

  const loadRepos = useCallback(async () => {
    if (!connection) return;
    setLoadingRepos(true);
    try {
      const res = await GitConnectionService.listGitHubRepos(workspaceId, connection.id);
      setRepos(res.items || []);
    } catch (error) {
      notification.error({
        message: 'Failed to load repositories',
        description: getApiErrorMessage(error),
      });
    } finally {
      setLoadingRepos(false);
    }
  }, [connection, workspaceId]);

  const loadBranches = useCallback(
    async (repoFullName: string, preferredBranch?: string) => {
      if (!connection || !repoFullName) {
        setBranches([]);
        return;
      }
      setLoadingBranches(true);
      try {
        const res = await GitConnectionService.listGitHubBranches(
          workspaceId,
          connection.id,
          repoFullName,
        );
        const items = res.items || [];
        setBranches(items);
        const branchNames = items.map((branch) => branch.name);
        const nextBranch =
          (preferredBranch && branchNames.includes(preferredBranch) && preferredBranch) ||
          branchNames[0] ||
          preferredBranch ||
          'main';
        form.setFieldValue('default_branch', nextBranch);
      } catch (error) {
        notification.error({
          message: 'Failed to load branches',
          description: getApiErrorMessage(error),
        });
      } finally {
        setLoadingBranches(false);
      }
    },
    [connection, form, workspaceId],
  );

  useEffect(() => {
    if (!open || !connection) return;
    form.resetFields();
    setRepos([]);
    setBranches([]);
    void loadRepos();
  }, [open, connection, form, loadRepos]);

  useEffect(() => {
    if (!open || !selectedRepo) return;
    const repo = repos.find((item) => item.full_name === selectedRepo);
    void loadBranches(selectedRepo, repo?.default_branch);
  }, [open, selectedRepo, repos, loadBranches]);

  const handleRepoChange = (repoFullName: string) => {
    const repo = repos.find((item) => item.full_name === repoFullName);
    form.setFieldValue('default_branch', repo?.default_branch || 'main');
  };

  const handleSubmit = async () => {
    if (!connection) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await GitConnectionService.importRepository(workspaceId, connection.id, values);
      notification.success({
        message: 'Repository imported',
        description: values.repo_full_name,
      });
      onImported();
      onClose();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      notification.error({
        message: 'Failed to import repository',
        description: getApiErrorMessage(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Import repository"
      open={open}
      onCancel={onClose}
      onOk={() => void handleSubmit()}
      okText="Import"
      confirmLoading={submitting}
      destroyOnClose
    >
      {connection ? (
        <Text type="secondary">
          Link a repository from <Text strong>{connection.account_login}</Text> to this workspace.
        </Text>
      ) : null}

      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="repo_full_name"
          label="Repository"
          rules={[{ required: true, message: 'Select a repository' }]}
        >
          <Select
            showSearch
            placeholder="Select a repository"
            loading={loadingRepos}
            optionFilterProp="label"
            notFoundContent={loadingRepos ? <Spin size="small" /> : 'No repositories found'}
            options={repos.map((repo) => ({
              value: repo.full_name,
              label: repo.full_name,
            }))}
            onChange={handleRepoChange}
          />
        </Form.Item>

        <Form.Item
          name="default_branch"
          label="Branch"
          rules={[{ required: true, message: 'Select a branch' }]}
        >
          <Select
            showSearch
            placeholder="Select a branch"
            loading={loadingBranches}
            disabled={!selectedRepo}
            optionFilterProp="label"
            notFoundContent={loadingBranches ? <Spin size="small" /> : 'No branches found'}
            options={branches.map((branch) => ({
              value: branch.name,
              label: branch.name,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
