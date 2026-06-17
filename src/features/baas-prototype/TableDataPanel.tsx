'use client';

import React from 'react';
import { Button, Tabs } from 'antd';
import { PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';
import SqlConfirmModal from '@/features/baas-prototype/SqlConfirmModal';
import TableDataGridTab from '@/features/baas-prototype/TableDataGridTab';
import TableRowFormModal from '@/features/baas-prototype/TableRowFormModal';
import TableSqlTab from '@/features/baas-prototype/TableSqlTab';
import { isMutatingSql } from '@/features/baas-prototype/tableRowSql';
import { useTableDataPanel } from '@/features/baas-prototype/useTableDataPanel';
import type { WorkspaceDatabaseTableDetail } from '@/services/workspaceDatabase.service';

type Props = {
  workspaceId: number;
  table: WorkspaceDatabaseTableDetail;
  active: boolean;
};

export default function TableDataPanel({ workspaceId, table, active }: Props) {
  const {
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
  } = useTableDataPanel({ workspaceId, table, active });

  return (
    <>
      <Tabs
        activeKey={view}
        onChange={(key) => onViewChange(key as 'grid' | 'sql')}
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
              <TableDataGridTab
                tableData={tableData}
                loading={tableDataLoading}
                page={tableDataPage}
                onPageChange={(page) => void loadTableData(page)}
                onOpenRowModal={openRowModal}
                onDeleteRow={onDeleteRow}
              />
            ),
          },
          {
            key: 'sql',
            label: 'SQL',
            children: (
              <TableSqlTab sql={sql} onSqlChange={setSql} sqlResult={sqlResult} />
            ),
          },
        ]}
      />

      <TableRowFormModal
        open={rowModalOpen}
        mode={rowModalMode}
        columns={table.columns}
        form={form}
        onCancel={() => setRowModalOpen(false)}
        onSave={() => void onRowModalSave()}
      />

      <SqlConfirmModal
        open={pendingAction !== null}
        title={pendingAction?.title ?? ''}
        sql={pendingAction?.sql ?? ''}
        confirmLabel={
          pendingAction?.kind === 'grid' ? pendingAction.confirmLabel ?? 'Save' : 'Run SQL'
        }
        danger={
          pendingAction?.kind === 'grid'
            ? pendingAction.danger
            : isMutatingSql(pendingAction?.sql ?? '')
        }
        editable={pendingAction?.kind === 'sql'}
        loading={confirmLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={(statement) => void onConfirmSql(statement)}
      />
    </>
  );
}
