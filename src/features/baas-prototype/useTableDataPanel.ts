'use client';

import { useCallback, useEffect, useState } from 'react';
import { Form, notification } from 'antd';
import {
  buildDeleteSql,
  buildInsertSql,
  buildUpdateSql,
  defaultSelectSql,
  isMutatingSql,
} from '@/features/baas-prototype/tableRowSql';
import {
  TABLE_DATA_PAGE_SIZE,
  type PendingAction,
  type RowFormMode,
  type SqlResultState,
  type TableDataState,
} from '@/features/baas-prototype/tableDataPanelTypes';
import { getApiErrorMessage } from '@/lib/formatApiError';
import {
  WorkspaceDatabaseService,
  type WorkspaceDatabaseTableDetail,
} from '@/services/workspaceDatabase.service';

type Params = {
  workspaceId: number;
  table: WorkspaceDatabaseTableDetail;
  active: boolean;
};

export function useTableDataPanel({ workspaceId, table, active }: Params) {
  const [view, setView] = useState<'grid' | 'sql'>('grid');
  const [tableData, setTableData] = useState<TableDataState>(null);
  const [tableDataLoading, setTableDataLoading] = useState(false);
  const [tableDataPage, setTableDataPage] = useState(1);
  const [sql, setSql] = useState(() =>
    defaultSelectSql(table.schema_name, table.table_name, TABLE_DATA_PAGE_SIZE),
  );
  const [sqlRunning, setSqlRunning] = useState(false);
  const [sqlResult, setSqlResult] = useState<SqlResultState | null>(null);
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

  const onViewChange = (next: 'grid' | 'sql') => {
    setView(next);
    if (next === 'grid' && !tableData) {
      void loadTableData(tableDataPage);
    }
  };

  return {
    view,
    tableData,
    tableDataLoading,
    tableDataPage,
    sql,
    setSql,
    sqlRunning,
    sqlResult,
    rowModalOpen,
    rowModalMode,
    pendingAction,
    confirmLoading,
    form,
    loadTableData,
    onViewChange,
    openRowModal,
    onDeleteRow,
    onRowModalSave,
    onRunSql,
    onConfirmSql,
    setRowModalOpen,
    setPendingAction,
  };
}
