'use client';

import React, { useMemo } from 'react';
import { Button, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {
  TABLE_DATA_PAGE_SIZE,
  type RowRecord,
  type RowFormMode,
  type TableDataState,
} from '@/features/baas-prototype/tableDataPanelTypes';
import { formatCellValue, toRowRecord } from '@/features/baas-prototype/tableDataPanelUtils';

type Props = {
  tableData: TableDataState;
  loading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onOpenRowModal: (mode: RowFormMode, row?: Record<string, unknown>) => void;
  onDeleteRow: (row: Record<string, unknown>) => void;
};

export default function TableDataGridTab({
  tableData,
  loading,
  page,
  onPageChange,
  onOpenRowModal,
  onDeleteRow,
}: Props) {
  const dataRows = useMemo(
    () => tableData?.rows.map((row, index) => toRowRecord(row, index, tableData.offset)) ?? [],
    [tableData],
  );

  const columns: ColumnsType<RowRecord> = useMemo(() => {
    const valueColumns =
      tableData?.columns.map((name) => ({
        title: name,
        dataIndex: name,
        key: name,
        ellipsis: true,
        render: (value: unknown) => formatCellValue(value),
      })) ?? [];

    return [
      ...valueColumns,
      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right' as const,
        width: 120,
        render: (_: unknown, record: RowRecord) => {
          const row: Record<string, unknown> = { ...record };
          delete row.__rowKey;
          return (
            <Space size="small">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                title="Edit row"
                onClick={() => onOpenRowModal('edit', row)}
              />
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                title="Copy row"
                onClick={() => onOpenRowModal('copy', row)}
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
  }, [tableData?.columns, onOpenRowModal, onDeleteRow]);

  return (
    <Table
      size="small"
      loading={loading}
      dataSource={dataRows}
      columns={columns}
      rowKey="__rowKey"
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: loading ? ' ' : 'No rows' }}
      pagination={{
        current: page,
        pageSize: TABLE_DATA_PAGE_SIZE,
        total: tableData?.total ?? 0,
        showSizeChanger: false,
        showTotal: (total) => `${total} row${total === 1 ? '' : 's'}`,
        onChange: onPageChange,
      }}
    />
  );
}
