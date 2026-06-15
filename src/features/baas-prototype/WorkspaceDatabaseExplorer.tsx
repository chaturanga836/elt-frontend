'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  Descriptions,
  Empty,
  Flex,
  Space,
  Spin,
  Table,
  Tag,
  Tree,
  Typography,
  notification,
} from 'antd';
import type { DataNode, EventDataNode } from 'antd/es/tree';
import { DatabaseOutlined, TableOutlined } from '@ant-design/icons';
import {
  WorkspaceDatabaseItem,
  WorkspaceDatabaseService,
  WorkspaceDatabaseTableDetail,
} from '@/services/workspaceDatabase.service';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Text, Title } = Typography;

type SchemaTreeNode = DataNode & {
  nodeType: 'schema' | 'table';
  databaseId?: number;
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

  useEffect(() => {
    setTreeData(
      databases.map((db) => ({
        key: schemaKey(db.id),
        title: db.name,
        icon: <DatabaseOutlined />,
        nodeType: 'schema' as const,
        databaseId: db.id,
        isLeaf: false,
      })),
    );
    setExpandedKeys([]);
    setSelectedKeys([]);
    onSelectTable(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset selection when schema list changes
  }, [databases]);

  const loadTables = useCallback(
    async (databaseId: number) => {
      const key = schemaKey(databaseId);
      setLoadingKeys((prev) => [...prev, key]);
      try {
        const res = await WorkspaceDatabaseService.listTables(workspaceId, databaseId);
        const children: SchemaTreeNode[] = res.tables.map((table) => ({
          key: tableKey(databaseId, table.name),
          title: table.name,
          icon: <TableOutlined />,
          nodeType: 'table' as const,
          databaseId,
          tableName: table.name,
          isLeaf: true,
        }));
        setTreeData((prev) =>
          prev.map((node) => (node.key === key ? { ...node, children } : node)),
        );
      } catch (err) {
        notification.error({
          message: 'Could not load tables',
          description: getApiErrorMessage(err),
        });
      } finally {
        setLoadingKeys((prev) => prev.filter((k) => k !== key));
      }
    },
    [workspaceId],
  );

  const onLoadData = useCallback(
    async (node: EventDataNode<SchemaTreeNode>) => {
      const data = node as SchemaTreeNode;
      if (data.nodeType !== 'schema' || !data.databaseId || data.children?.length) {
        return;
      }
      await loadTables(data.databaseId);
    },
    [loadTables],
  );

  const onExpand = useCallback((keys: React.Key[]) => {
    setExpandedKeys(keys.map(String));
  }, []);

  const onSelect = useCallback(
    async (_keys: React.Key[], info: { node: EventDataNode<SchemaTreeNode> }) => {
      const data = info.node as SchemaTreeNode;
      if (data.nodeType !== 'table' || !data.databaseId || !data.tableName) {
        return;
      }
      setSelectedKeys([String(data.key)]);
      setDetailLoading(true);
      try {
        const detail = await WorkspaceDatabaseService.getTableDetail(
          workspaceId,
          data.databaseId,
          data.tableName,
        );
        onSelectTable(detail);
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

  const columnTable = useMemo(
    () =>
      selectedTable?.columns.map((col) => ({
        key: col.name,
        ...col,
      })) ?? [],
    [selectedTable],
  );

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

      <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
        {detailLoading ? (
          <Flex align="center" justify="center" style={{ minHeight: 240 }}>
            <Spin />
          </Flex>
        ) : selectedTable ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={4} style={{ marginBottom: 4 }}>
                {selectedTable.schema_name}.{selectedTable.table_name}
              </Title>
              <Text type="secondary">
                {selectedTable.columns.length} column
                {selectedTable.columns.length === 1 ? '' : 's'}
              </Text>
            </div>

            <Descriptions size="small" bordered column={2}>
              <Descriptions.Item label="Schema">{selectedTable.schema_name}</Descriptions.Item>
              <Descriptions.Item label="Table">{selectedTable.table_name}</Descriptions.Item>
            </Descriptions>

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
                  render: (value: boolean) =>
                    value ? <Tag color="gold">PK</Tag> : null,
                },
              ]}
            />
          </Space>
        ) : (
          <Flex align="center" justify="center" style={{ minHeight: 240 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Expand a schema and select a table to view its columns"
            />
          </Flex>
        )}
      </div>
    </Flex>
  );
}
