'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Flex, Select, Spin, Typography, notification } from 'antd';
import { useRouter } from 'next/navigation';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { projectPath } from '@/lib/paths';
import TableSchemaEditor from '@/features/baas-prototype/TableSchemaEditor';
import {
  WorkspaceDatabaseItem,
  WorkspaceDatabaseService,
} from '@/services/workspaceDatabase.service';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text } = Typography;

export default function TableBuilderPage() {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const [databases, setDatabases] = useState<WorkspaceDatabaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [databaseId, setDatabaseId] = useState<number | null>(null);
  const [schemaName, setSchemaName] = useState<string>('');
  const [availableTables, setAvailableTables] = useState<string[]>([]);

  const loadDatabases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await WorkspaceDatabaseService.list(workspaceId);
      setDatabases(res.databases);
      if (res.databases.length > 0) {
        const first = res.databases[0];
        setDatabaseId(first.id);
        setSchemaName(first.name);
      }
    } catch (err) {
      notification.error({
        message: 'Could not load databases',
        description: getApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const loadTables = useCallback(
    async (dbId: number) => {
      try {
        const res = await WorkspaceDatabaseService.listTables(workspaceId, dbId);
        setAvailableTables(res.tables.map((t) => t.name));
        setSchemaName(res.schema_name);
      } catch (err) {
        notification.error({
          message: 'Could not load tables',
          description: getApiErrorMessage(err),
        });
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    void loadDatabases();
  }, [loadDatabases]);

  useEffect(() => {
    if (databaseId !== null) {
      void loadTables(databaseId);
    }
  }, [databaseId, loadTables]);

  const onDatabaseChange = (value: number) => {
    setDatabaseId(value);
    const db = databases.find((d) => d.id === value);
    if (db) setSchemaName(db.name);
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 360 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (databaseId === null || !schemaName) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 360 }}>
        <Text type="secondary">No database available. Add a database first.</Text>
      </Flex>
    );
  }

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ padding: '16px 24px 0' }}>
        <div>
          <Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
            Table Builder
          </Title>
          <Text type="secondary">Design tables visually and apply DDL to your project database.</Text>
        </div>
        <Select
          style={{ minWidth: 200 }}
          value={databaseId}
          options={databases.map((db) => ({ label: db.name, value: db.id }))}
          onChange={onDatabaseChange}
        />
      </Flex>

      <TableSchemaEditor
        mode="create"
        workspaceId={workspaceId}
        databaseId={databaseId}
        schemaName={schemaName}
        availableTables={availableTables}
        fullPage
        onCancel={() => router.push(projectPath(workspaceId, 'db/sql'))}
        onSaved={(tableName) => {
          void loadTables(databaseId);
          notification.info({
            message: 'Table saved',
            description: `Open the schema browser to view "${tableName}".`,
          });
        }}
      />
    </div>
  );
}
