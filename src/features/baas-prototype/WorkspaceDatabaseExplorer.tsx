'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Flex,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tree,
  Typography,
  notification,
} from 'antd';
import type { DataNode, EventDataNode } from 'antd/es/tree';
import { DatabaseOutlined, PlusOutlined, TableOutlined } from '@ant-design/icons';
import TableSchemaEditor from '@/features/baas-prototype/TableSchemaEditor';
import TableDataPanel from '@/features/baas-prototype/TableDataPanel';
import {
  WorkspaceDatabaseItem,
  WorkspaceDatabaseService,
  WorkspaceDatabaseTableDetail,
} from '@/services/workspaceDatabase.service';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Text, Title } = Typography;

type PanelMode = 'browse' | 'create' | 'edit';
type DetailTab = 'properties' | 'data';

type SchemaTreeNode = DataNode & {
  nodeType: 'schema' | 'table';
  databaseId?: number;
  schemaName?: string;
  tableName?: string;
};

type Props = {
  workspaceId: number;
  databases: WorkspaceDatabaseItem[];
  selectedTable: WorkspaceDatabaseTableDetail | null;
  onSelectTable: (detail: WorkspaceDatabaseTableDetail | null) => void;
};

function schemaKey(databaseId: number) {
  return `schema-${databaseId}`;
}

function tableKey(databaseId: number, tableName: string) {
  return `table-${databaseId}-${tableName}`;
}

export default function WorkspaceDatabaseExplorer({
  workspaceId,
  databases,
  selectedTable,
  onSelectTable,
}: Props) {
  const [treeData, setTreeData] = useState<SchemaTreeNode[]>([]);
  const [loadingKeys, setLoadingKeys] = useState<string[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [panelMode, setPanelMode] = useState<PanelMode>('browse');
  const [activeDatabaseId, setActiveDatabaseId] = useState<number | null>(null);
  const [activeSchemaName, setActiveSchemaName] = useState<string | null>(null);
  const [tablesForSchema, setTablesForSchema] = useState<Record<number, string[]>>({});
  const [loadedSchemas, setLoadedSchemas] = useState<Record<number, boolean>>({});
  const [detailTab, setDetailTab] = useState<DetailTab>('properties');

  useEffect(() => {
    setTreeData(
      databases.map((db) => ({
        key: schemaKey(db.id),
        title: db.name,
        icon: <DatabaseOutlined />,
        nodeType: 'schema' as const,
        databaseId: db.id,
        schemaName: db.name,
        isLeaf: false,
      })),
    );
    setExpandedKeys([]);
    setSelectedKeys([]);
    setPanelMode('browse');
    setActiveDatabaseId(null);
    setActiveSchemaName(null);
    setTablesForSchema({});
    setLoadedSchemas({});
    setDetailTab('properties');
    onSelectTable(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset selection when schema list changes
  }, [databases]);

  const loadTables = useCallback(
    async (databaseId: number, schemaName: string) => {
      const key = schemaKey(databaseId);
      setLoadingKeys((prev) => [...prev, key]);
      try {
        const res = await WorkspaceDatabaseService.listTables(workspaceId, databaseId);
        const tableNames = res.tables.map((t) => t.name);
        const children: SchemaTreeNode[] = res.tables.map((table) => ({
          key: tableKey(databaseId, table.name),
          title: table.name,
          icon: <TableOutlined />,
          nodeType: 'table' as const,
          databaseId,
          schemaName,
          tableName: table.name,
          isLeaf: true,
        }));
        setTreeData((prev) =>
          prev.map((node) => (node.key === key ? { ...node, children } : node)),
        );
        setTablesForSchema((prev) => ({ ...prev, [databaseId]: tableNames }));
        setLoadedSchemas((prev) => ({ ...prev, [databaseId]: true }));
        return tableNames;
      } catch (err) {
        notification.error({
          message: 'Could not load tables',
          description: getApiErrorMessage(err),
        });
        return [];
      } finally {
        setLoadingKeys((prev) => prev.filter((k) => k !== key));
      }
    },
    [workspaceId],
  );

  const openCreateMode = useCallback((databaseId: number, schemaName: string) => {
    setActiveDatabaseId(databaseId);
    setActiveSchemaName(schemaName);
    setPanelMode('create');
    onSelectTable(null);
    setSelectedKeys([]);
  }, [onSelectTable]);

  const openEditMode = useCallback(() => {
    if (!selectedTable) return;
    setActiveDatabaseId(selectedTable.database_id);
    setActiveSchemaName(selectedTable.schema_name);
    setPanelMode('edit');
  }, [selectedTable]);

  const closeEditor = useCallback(() => {
    setPanelMode('browse');
  }, []);

  const onLoadData = useCallback(
    async (node: EventDataNode<SchemaTreeNode>) => {
      const data = node as SchemaTreeNode;
      if (data.nodeType !== 'schema' || !data.databaseId || data.children?.length) {
        return;
      }
      const schemaName = data.schemaName ?? data.title?.toString() ?? '';
      setActiveDatabaseId(data.databaseId);
      setActiveSchemaName(schemaName);
      await loadTables(data.databaseId, schemaName);
    },
    [loadTables],
  );

  const onExpand = useCallback(
    async (keys: React.Key[], info: { node: EventDataNode<SchemaTreeNode> }) => {
      setExpandedKeys(keys.map(String));
      const data = info.node as SchemaTreeNode;
      if (data.nodeType === 'schema' && data.databaseId) {
        const schemaName = data.schemaName ?? data.title?.toString() ?? '';
        setActiveDatabaseId(data.databaseId);
        setActiveSchemaName(schemaName);
        if (!loadedSchemas[data.databaseId]) {
          await loadTables(data.databaseId, schemaName);
        }
      }
    },
    [loadTables, loadedSchemas],
  );

  const selectTable = useCallback(
    async (databaseId: number, tableName: string) => {
      setSelectedKeys([tableKey(databaseId, tableName)]);
      setDetailLoading(true);
      setPanelMode('browse');
      setDetailTab('properties');
      try {
        const detail = await WorkspaceDatabaseService.getTableDetail(
          workspaceId,
          databaseId,
          tableName,
        );
        onSelectTable(detail);
        setActiveDatabaseId(databaseId);
        setActiveSchemaName(detail.schema_name);
      } catch (err) {
        notification.error({
          message: 'Could not load table metadata',
          description: getApiErrorMessage(err),
        });
      } finally {
        setDetailLoading(false);
      }
    },
    [workspaceId, onSelectTable],
  );

  const onSelect = useCallback(
    async (_keys: React.Key[], info: { node: EventDataNode<SchemaTreeNode> }) => {
      const data = info.node as SchemaTreeNode;
      if (data.nodeType !== 'table' || !data.databaseId || !data.tableName) {
        return;
      }
      await selectTable(data.databaseId, data.tableName);
    },
    [selectTable],
  );

  const onEditorSaved = useCallback(
    async (tableName: string) => {
      if (activeDatabaseId === null || !activeSchemaName) return;
      await loadTables(activeDatabaseId, activeSchemaName);
      setPanelMode('browse');
      await selectTable(activeDatabaseId, tableName);
    },
    [activeDatabaseId, activeSchemaName, loadTables, selectTable],
  );

  const onDetailTabChange = useCallback((key: string) => {
    setDetailTab(key as DetailTab);
  }, []);

  const columnTable = useMemo(
    () =>
      selectedTable?.columns.map((col) => ({
        key: col.name,
        ...col,
      })) ?? [],
    [selectedTable],
  );

  const activeTables = activeDatabaseId !== null ? tablesForSchema[activeDatabaseId] : undefined;
  const schemaIsEmpty =
    activeDatabaseId !== null &&
    loadedSchemas[activeDatabaseId] &&
    (activeTables?.length ?? 0) === 0;

  const availableTablesForEditor =
    activeDatabaseId !== null ? (tablesForSchema[activeDatabaseId] ?? []) : [];

  const renderRightPanel = () => {
    if (panelMode === 'create' && activeDatabaseId !== null && activeSchemaName) {
      return (
        <TableSchemaEditor
          mode="create"
          workspaceId={workspaceId}
          databaseId={activeDatabaseId}
          schemaName={activeSchemaName}
          availableTables={availableTablesForEditor}
          onCancel={closeEditor}
          onSaved={onEditorSaved}
        />
      );
    }

    if (panelMode === 'edit' && activeDatabaseId !== null && activeSchemaName && selectedTable) {
      return (
        <TableSchemaEditor
          mode="edit"
          workspaceId={workspaceId}
          databaseId={activeDatabaseId}
          schemaName={activeSchemaName}
          initialTable={selectedTable}
          availableTables={availableTablesForEditor}
          onCancel={closeEditor}
          onSaved={onEditorSaved}
        />
      );
    }

    if (detailLoading) {
      return (
        <Flex align="center" justify="center" style={{ minHeight: 240 }}>
          <Spin />
        </Flex>
      );
    }

    if (selectedTable) {
      return (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Flex justify="space-between" align="start">
            <div>
              <Title level={4} style={{ marginBottom: 4 }}>
                {selectedTable.schema_name}.{selectedTable.table_name}
              </Title>
              <Text type="secondary">
                {selectedTable.columns.length} column
                {selectedTable.columns.length === 1 ? '' : 's'}
              </Text>
            </div>
            <Button type="primary" onClick={openEditMode}>
              Edit table
            </Button>
          </Flex>

          <Tabs
            activeKey={detailTab}
            onChange={onDetailTabChange}
            items={[
              {
                key: 'properties',
                label: 'Properties',
                children: (
                  <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    <Table
                      size="small"
                      pagination={false}
                      dataSource={columnTable}
                      rowKey="name"
                      columns={[
                        { title: 'Column', dataIndex: 'name', key: 'name' },
                        { title: 'Type', dataIndex: 'type', key: 'type' },
                        {
                          title: 'Nullable',
                          dataIndex: 'nullable',
                          key: 'nullable',
                          render: (value: boolean) => (value ? 'YES' : 'NO'),
                        },
                        {
                          title: 'Default',
                          dataIndex: 'default',
                          key: 'default',
                          render: (value?: string | null) => value ?? '—',
                        },
                        {
                          title: 'PK',
                          dataIndex: 'primary_key',
                          key: 'primary_key',
                          render: (value: boolean) => (value ? <Tag color="gold">PK</Tag> : null),
                        },
                      ]}
                    />

                    {(selectedTable.indexes?.length ?? 0) > 0 && (
                      <Table
                        size="small"
                        pagination={false}
                        title={() => 'Indexes'}
                        dataSource={selectedTable.indexes}
                        rowKey="name"
                        columns={[
                          { title: 'Name', dataIndex: 'name', key: 'name' },
                          {
                            title: 'Columns',
                            dataIndex: 'columns',
                            key: 'columns',
                            render: (cols: string[]) => cols.join(', '),
                          },
                          {
                            title: 'Unique',
                            dataIndex: 'unique',
                            key: 'unique',
                            render: (v: boolean) => (v ? 'YES' : 'NO'),
                          },
                        ]}
                      />
                    )}

                    {(selectedTable.foreign_keys?.length ?? 0) > 0 && (
                      <Table
                        size="small"
                        pagination={false}
                        title={() => 'Foreign keys'}
                        dataSource={selectedTable.foreign_keys}
                        rowKey="name"
                        columns={[
                          { title: 'Name', dataIndex: 'name', key: 'name' },
                          {
                            title: 'Column',
                            dataIndex: 'constrained_columns',
                            key: 'constrained_columns',
                            render: (cols: string[]) => cols.join(', '),
                          },
                          {
                            title: 'References',
                            key: 'ref',
                            render: (_: unknown, row) =>
                              `${row.referred_table} (${row.referred_columns.join(', ')})`,
                          },
                          {
                            title: 'On delete',
                            dataIndex: 'on_delete',
                            key: 'on_delete',
                            render: (v?: string | null) => v ?? '—',
                          },
                        ]}
                      />
                    )}
                  </Space>
                ),
              },
              {
                key: 'data',
                label: 'Data',
                children: (
                  <TableDataPanel
                    workspaceId={workspaceId}
                    table={selectedTable}
                    active={detailTab === 'data'}
                  />
                ),
              },
            ]}
          />
        </Space>
      );
    }

    if (schemaIsEmpty && activeDatabaseId !== null && activeSchemaName) {
      return (
        <Flex align="center" justify="center" style={{ minHeight: 280 }} vertical gap="middle">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tables in this schema yet" />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openCreateMode(activeDatabaseId, activeSchemaName)}
          >
            Create table
          </Button>
        </Flex>
      );
    }

    return (
      <Flex align="center" justify="center" style={{ minHeight: 240 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Expand a schema and select a table to view its columns"
        />
      </Flex>
    );
  };

  return (
    <Flex style={{ minHeight: 480, borderTop: '1px solid #f0f0f0' }}>
      <Card
        size="small"
        title="Schemas"
        style={{
          width: 280,
          flexShrink: 0,
          borderRadius: 0,
          borderTop: 'none',
          borderBottom: 'none',
          borderLeft: 'none',
        }}
        styles={{ body: { padding: '8px 0', maxHeight: 'calc(100vh - 220px)', overflow: 'auto' } }}
        extra={
          activeDatabaseId !== null && activeSchemaName ? (
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => openCreateMode(activeDatabaseId, activeSchemaName)}
              title="Create table"
            />
          ) : null
        }
      >
        {treeData.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No schemas" />
        ) : (
          <Tree
            showIcon
            blockNode
            loadData={onLoadData}
            treeData={treeData}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            onExpand={onExpand}
            onSelect={onSelect}
          />
        )}
        {loadingKeys.length > 0 && (
          <Flex justify="center" style={{ padding: 8 }}>
            <Spin size="small" />
          </Flex>
        )}
      </Card>

      <div style={{ flex: 1, padding: panelMode === 'browse' ? 16 : 0, overflow: 'auto' }}>
        {renderRightPanel()}
      </div>
    </Flex>
  );
}
