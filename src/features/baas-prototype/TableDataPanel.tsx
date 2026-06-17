'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Space,
  Table,
  Tabs,
  Typography,
  notification,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import SqlConfirmModal from '@/features/baas-prototype/SqlConfirmModal';
import {
  buildDeleteSql,
  buildInsertSql,
  buildUpdateSql,
  defaultSelectSql,
  isMutatingSql,
} from '@/features/baas-prototype/tableRowSql';
import { getApiErrorMessage } from '@/lib/formatApiError';
import {
  WorkspaceDatabaseService,
  WorkspaceDatabaseTableDataResponse,
  WorkspaceDatabaseTableDetail,
} from '@/services/workspaceDatabase.service';

const { Text } = Typography;

const TABLE_DATA_PAGE_SIZE = 50;

type RowRecord = Record<string, unknown> & { __rowKey: string };

type RowFormMode = 'insert' | 'edit' | 'copy';

type PendingAction =
  | { kind: 'grid'; title: string; sql: string; danger?: boolean; confirmLabel?: string }
  | { kind: 'sql'; title: string; sql: string };

type Props = {
  workspaceId: number;
  table: WorkspaceDatabaseTableDetail;
  active: boolean;
};

function rowKeyFor(index: number, offset: number) {
  return `row-${offset + index}`;
}

function toRowRecord(row: Record<string, unknown>, index: number, offset: number): RowRecord {
  return { ...row, __rowKey: rowKeyFor(index, offset) };
}

export default function TableDataPanel({ workspaceId, table, active }: Props) {
  const [view, setView] = useState<'grid' | 'sql'>('grid');
  const [tableData, setTableData] = useState<WorkspaceDatabaseTableDataResponse | null>(null);
  const [tableDataLoading, setTableDataLoading] = useState(false);
  const [tableDataPage, setTableDataPage] = useState(1);
  const [sql, setSql] = useState(() =>
    defaultSelectSql(table.schema_name, table.table_name, TABLE_DATA_PAGE_SIZE),
  );
  const [sqlRunning, setSqlRunning] = useState(false);
  const [sqlResult, setSqlResult] = useState<{
    columns: string[];
    rows: Record<string, unknown>[];
    rowCount?: number;
    rowsAffected?: number;
    truncated?: boolean;
    statementType: string;
  } | null>(null);
  const [rowModalOpen, setRowModalOpen] = useState(false);
  const [rowModalMode, setRowModalMode] = useState<RowFormMode>('insert');
  const [rowModalOriginal, setRowModalOriginal] = useState<Record<string, unknown> | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm<Record<string, unknown>>();

  useEffect(() => {
    setSql(defaultSelectSql(table.schema_name, table.table_name, TABLE_DATA_PAGE_SIZE));
    setTableData(null);
    setTableDataPage(1);
    setSqlResult(null);
    setView('grid');
  }, [table.database_id, table.schema_name, table.table_name]);

  const loadTableData = useCallback(
    async (page = 1) => {
      setTableDataLoading(true);
      try {
        const offset = (page - 1) * TABLE_DATA_PAGE_SIZE;
        const data = await WorkspaceDatabaseService.getTableData(
          workspaceId,
          table.database_id,
          table.table_name,
          { limit: TABLE_DATA_PAGE_SIZE, offset },
        );
        setTableData(data);
        setTableDataPage(page);
      } catch (err) {
        notification.error({
          message: 'Could not load table data',
          description: getApiErrorMessage(err),
        });
      } finally {
        setTableDataLoading(false);
      }
    },
    [workspaceId, table.database_id, table.table_name],
  );

  useEffect(() => {
    if (active && view === 'grid' && !tableData && !tableDataLoading) {
      void loadTableData(tableDataPage);
    }
  }, [active, view, tableData, tableDataLoading, loadTableData, tableDataPage]);

  const executeSql = useCallback(
    async (statement: string) => {
      const result = await WorkspaceDatabaseService.executeSql(
        workspaceId,
        table.database_id,
        statement,
      );
      if (result.statement_type === 'select') {
        setSqlResult({
          columns: result.columns ?? [],
          rows: result.rows ?? [],
          rowCount: result.row_count,
          truncated: result.truncated,
          statementType: result.statement_type,
        });
      } else {
        setSqlResult({
          columns: [],
          rows: [],
          rowsAffected: result.rows_affected ?? 0,
          statementType: result.statement_type,
        });
        notification.success({
          message: 'SQL executed',
          description: `${result.rows_affected ?? 0} row(s) affected`,
        });
        if (view === 'grid') {
          void loadTableData(tableDataPage);
        }
      }
    },
    [workspaceId, table.database_id, view, loadTableData, tableDataPage],
  );

  const openConfirm = useCallback((action: PendingAction) => {
    setPendingAction(action);
  }, []);

  const onConfirmSql = useCallback(
    async (statement: string) => {
      setConfirmLoading(true);
      try {
        await executeSql(statement);
        setPendingAction(null);
        setRowModalOpen(false);
      } catch (err) {
        notification.error({
          message: 'SQL execution failed',
          description: getApiErrorMessage(err),
        });
      } finally {
        setConfirmLoading(false);
      }
    },
    [executeSql],
  );

  const openRowModal = useCallback(
    (mode: RowFormMode, row?: Record<string, unknown>) => {
      setRowModalMode(mode);
      setRowModalOriginal(row ?? null);
      const initial: Record<string, unknown> = {};
      for (const col of table.columns) {
        if (mode === 'insert') {
          initial[col.name] = col.nullable ? null : '';
        } else if (row) {
          initial[col.name] =
            mode === 'copy' && col.primary_key ? null : (row[col.name] ?? null);
        }
      }
      form.setFieldsValue(initial);
      setRowModalOpen(true);
    },
    [form, table.columns],
  );

  const onDeleteRow = useCallback(
    (row: Record<string, unknown>) => {
      openConfirm({
        kind: 'grid',
        title: 'Confirm delete',
        sql: buildDeleteSql(table.schema_name, table.table_name, table.columns, row),
        danger: true,
        confirmLabel: 'Delete',
      });
    },
    [openConfirm, table.schema_name, table.table_name, table.columns],
  );

  const onRowModalSave = async () => {
    const rawValues = await form.validateFields();
    const values: Record<string, unknown> = {};
    for (const col of table.columns) {
      let value = rawValues[col.name];
      if (value === '' || value === undefined) {
        value = col.nullable ? null : value;
      }
      values[col.name] = value;
    }
    let generated = '';
    let title = '';
    if (rowModalMode === 'edit' && rowModalOriginal) {
      generated = buildUpdateSql(
        table.schema_name,
        table.table_name,
        table.columns,
        rowModalOriginal,
        values,
      );
      title = 'Confirm update';
    } else {
      generated = buildInsertSql(
        table.schema_name,
        table.table_name,
        table.columns,
        values,
        { omitPrimaryKeys: rowModalMode === 'copy' || rowModalMode === 'insert' },
      );
      title = rowModalMode === 'copy' ? 'Confirm copy as insert' : 'Confirm insert';
    }
    openConfirm({
      kind: 'grid',
      title,
      sql: generated,
      confirmLabel: 'Save',
    });
  };

  const onRunSql = () => {
    const trimmed = sql.trim();
    if (!trimmed) return;
    if (isMutatingSql(trimmed)) {
      openConfirm({
        kind: 'sql',
        title: 'Confirm SQL execution',
        sql: trimmed,
      });
      return;
    }
    setSqlRunning(true);
    void executeSql(trimmed)
      .catch((err) => {
        notification.error({
          message: 'SQL execution failed',
          description: getApiErrorMessage(err),
        });
      })
      .finally(() => setSqlRunning(false));
  };

  const dataRows = useMemo(
    () =>
      tableData?.rows.map((row, index) =>
        toRowRecord(row, index, tableData.offset),
      ) ?? [],
    [tableData],
  );

  const gridColumns: ColumnsType<RowRecord> = useMemo(() => {
    const valueColumns =
      tableData?.columns.map((name) => ({
        title: name,
        dataIndex: name,
        key: name,
        ellipsis: true,
        render: (value: unknown) => {
          if (value === null || value === undefined) return '—';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value);
        },
      })) ?? [];

    return [
      ...valueColumns,
      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right' as const,
        width: 120,
        render: (_: unknown, record: RowRecord) => {
          const { __rowKey: _key, ...row } = record;
          return (
            <Space size="small">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                title="Edit row"
                onClick={() => openRowModal('edit', row)}
              />
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                title="Copy row"
                onClick={() => openRowModal('copy', row)}
              />
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                title="Delete row"
                onClick={() => onDeleteRow(row)}
              />
            </Space>
          );
        },
      },
    ];
  }, [tableData?.columns, openRowModal, onDeleteRow]);

  const sqlResultColumns =
    sqlResult?.columns.map((name) => ({
      title: name,
      dataIndex: name,
      key: name,
      ellipsis: true,
      render: (value: unknown) => {
        if (value === null || value === undefined) return '—';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      },
    })) ?? [];

  const sqlResultRows =
    sqlResult?.rows.map((row, index) => ({ key: `sql-${index}`, ...row })) ?? [];

  const renderFormField = (col: (typeof table.columns)[number]) => {
    const upperType = col.type.toUpperCase();
    const isNumeric =
      upperType.includes('INT') ||
      upperType.includes('NUMERIC') ||
      upperType.includes('DECIMAL') ||
      upperType.includes('FLOAT') ||
      upperType.includes('DOUBLE') ||
      upperType.includes('REAL');

    const skipRequired =
      col.nullable ||
      Boolean(col.default) ||
      (col.primary_key && (rowModalMode === 'insert' || rowModalMode === 'copy'));

    const rules = skipRequired
      ? []
      : [{ required: true, message: `${col.name} is required` }];

    return (
      <Form.Item
        key={col.name}
        name={col.name}
        label={`${col.name} (${col.type})`}
        rules={rules}
      >
        {isNumeric ? (
          <InputNumber style={{ width: '100%' }} placeholder={col.nullable ? 'NULL' : undefined} />
        ) : (
          <Input placeholder={col.nullable ? 'NULL' : undefined} />
        )}
      </Form.Item>
    );
  };

  return (
    <>
      <Tabs
        activeKey={view}
        onChange={(key) => {
          const next = key as 'grid' | 'sql';
          setView(next);
          if (next === 'grid' && !tableData) {
            void loadTableData(tableDataPage);
          }
        }}
        tabBarExtraContent={
          view === 'grid' ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openRowModal('insert')}>
              Add row
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={sqlRunning}
              onClick={onRunSql}
            >
              Run
            </Button>
          )
        }
        items={[
          {
            key: 'grid',
            label: 'Grid',
            children: (
              <Table
                size="small"
                loading={tableDataLoading}
                dataSource={dataRows}
                columns={gridColumns}
                rowKey="__rowKey"
                scroll={{ x: 'max-content' }}
                locale={{ emptyText: tableDataLoading ? ' ' : 'No rows' }}
                pagination={{
                  current: tableDataPage,
                  pageSize: TABLE_DATA_PAGE_SIZE,
                  total: tableData?.total ?? 0,
                  showSizeChanger: false,
                  showTotal: (total) => `${total} row${total === 1 ? '' : 's'}`,
                  onChange: (page) => {
                    void loadTableData(page);
                  },
                }}
              />
            ),
          },
          {
            key: 'sql',
            label: 'SQL',
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                  <Editor
                    height="240px"
                    defaultLanguage="sql"
                    value={sql}
                    onChange={(value) => setSql(value ?? '')}
                    options={{ minimap: { enabled: false }, fontSize: 13 }}
                  />
                </div>
                {sqlResult && (
                  <div>
                    <Text type="secondary">
                      {sqlResult.statementType === 'select'
                        ? `${sqlResult.rowCount ?? 0} row(s)${sqlResult.truncated ? ' (truncated)' : ''}`
                        : `${sqlResult.rowsAffected ?? 0} row(s) affected`}
                    </Text>
                    {sqlResult.statementType === 'select' && sqlResult.columns.length > 0 && (
                      <Table
                        size="small"
                        style={{ marginTop: 8 }}
                        columns={sqlResultColumns}
                        dataSource={sqlResultRows}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                      />
                    )}
                  </div>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={
          rowModalMode === 'edit'
            ? 'Edit row'
            : rowModalMode === 'copy'
              ? 'Copy row'
              : 'Add row'
        }
        open={rowModalOpen}
        onCancel={() => setRowModalOpen(false)}
        onOk={() => void onRowModalSave()}
        okText="Save"
        width={560}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          {table.columns.map((col) => renderFormField(col))}
        </Form>
      </Modal>

      <SqlConfirmModal
        open={pendingAction !== null}
        title={pendingAction?.title ?? ''}
        sql={pendingAction?.sql ?? ''}
        confirmLabel={
          pendingAction?.kind === 'grid' ? pendingAction.confirmLabel ?? 'Save' : 'Run SQL'
        }
        danger={pendingAction?.kind === 'grid' ? pendingAction.danger : isMutatingSql(pendingAction?.sql ?? '')}
        editable={pendingAction?.kind === 'sql'}
        loading={confirmLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={(statement) => void onConfirmSql(statement)}
      />
    </>
  );
}
