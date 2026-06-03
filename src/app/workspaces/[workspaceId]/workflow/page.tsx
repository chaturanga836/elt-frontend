'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Table, Typography, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { WorkflowService } from '@/services/workflow.service';
import { WorkflowListItem } from '@/types/workflow';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';

const { Title, Text } = Typography;

export default function WorkflowListPage() {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<WorkflowListItem[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await WorkflowService.listWorkflows(workspaceId);
      setItems(res.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceId]);

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'UUID',
      dataIndex: 'workflow_uuid',
      key: 'uuid',
      ellipsis: true,
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (v: number) => <Tag>v{v}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: WorkflowListItem) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => router.push(workspacePath(workspaceId, `workflow/${record.workflow_uuid}`))}
          />
          <Button
            type="link"
            icon={<PlayCircleOutlined />}
            onClick={async () => {
              await WorkflowService.runWorkflow(record.workflow_uuid);
              load();
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Workflows
          </Title>
          <Text type="secondary">
            Design branching diagrams with pipelines, if/else, and parallel execution
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push(workspacePath(workspaceId, 'workflow/new'))}
          style={{ background: '#722ed1', borderColor: '#722ed1' }}
        >
          New Workflow
        </Button>
      </div>
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
