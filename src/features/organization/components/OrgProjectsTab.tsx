'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Table, Tag, notification } from 'antd';
import Link from 'next/link';
import { SettingOutlined } from '@ant-design/icons';
import { OrganizationSettingsService } from '@/services/organization-settings.service';
import { StudioProject } from '@/services/studio.service';
import { projectPath } from '@/lib/paths';

export default function OrgProjectsTab() {
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await OrganizationSettingsService.listProjects();
      setProjects(res.items);
    } catch {
      notification.error({ message: 'Failed to load projects' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Table
      rowKey="project_id"
      loading={loading}
      dataSource={projects}
      pagination={false}
      columns={[
        { title: 'ID', dataIndex: 'project_id', key: 'project_id', width: 80 },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          render: (status: string) => <Tag>{status}</Tag>,
        },
        {
          title: 'Description',
          dataIndex: 'description',
          key: 'description',
          ellipsis: true,
        },
        {
          title: 'Actions',
          key: 'actions',
          width: 140,
          render: (_: unknown, row: StudioProject) => (
            <Link href={projectPath(row.project_id, 'settings')}>
              <Button type="link" icon={<SettingOutlined />} size="small">
                Project settings
              </Button>
            </Link>
          ),
        },
      ]}
    />
  );
}
