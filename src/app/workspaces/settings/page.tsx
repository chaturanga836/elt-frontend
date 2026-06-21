'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Result, Spin, Tabs, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import AppBrand from '@/components/brand/AppBrand';
import { StudioService } from '@/services/studio.service';
import {
  canManageOrgSettings,
} from '@/services/organization-settings.service';
import { useAuthStore } from '@/store/useAuthStore';
import OrgProjectsTab from '@/features/organization/components/OrgProjectsTab';
import OrgMembersTab from '@/features/organization/components/OrgMembersTab';
import OrgAuditLogsTab from '@/features/organization/components/OrgAuditLogsTab';
import OrgIntegrationsTab from '@/features/organization/components/OrgIntegrationsTab';

const { Title, Text } = Typography;

export default function OrganizationSettingsPage() {
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const account = await StudioService.getAccount();
        if (!cancelled) {
          setOrgName(account.organization.name);
          setAllowed(canManageOrgSettings(account.user.role, isSuperAdmin));
        }
      } catch {
        if (!cancelled) {
          setAllowed(isSuperAdmin);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="p-8">
        <Result
          status="403"
          title="Access denied"
          subTitle="Only account owners can manage organization settings."
          extra={
            <Link href="/projects">
              <Button type="primary">Back to projects</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-8" style={{ minHeight: '100vh' }}>
      <Link href="/projects">
        <Button type="text" icon={<ArrowLeftOutlined />} className="mb-4">
          All projects
        </Button>
      </Link>

      <div style={{ marginBottom: 12 }}>
        <AppBrand variant="header" />
      </div>
      <Title level={2} style={{ marginTop: 0 }}>
        Account settings
      </Title>
      <Text type="secondary">
        {orgName ? `${orgName} · ` : ''}
        Manage projects, members, integrations, and audit logs for your account.
      </Text>

      <Card className="mt-6">
        <Tabs
          items={[
            {
              key: 'projects',
              label: 'Projects',
              children: <OrgProjectsTab />,
            },
            {
              key: 'members',
              label: 'Members',
              children: <OrgMembersTab />,
            },
            {
              key: 'audit',
              label: 'Audit logs',
              children: <OrgAuditLogsTab />,
            },
            {
              key: 'integrations',
              label: 'Integrations',
              children: <OrgIntegrationsTab />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
