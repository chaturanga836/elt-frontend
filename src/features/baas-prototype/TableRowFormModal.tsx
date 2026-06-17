'use client';

import React from 'react';
import { Form, Input, InputNumber, Modal } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { RowFormMode } from '@/features/baas-prototype/tableDataPanelTypes';
import type { WorkspaceDatabaseTableColumn } from '@/services/workspaceDatabase.service';

type Props = {
  open: boolean;
  mode: RowFormMode;
  columns: WorkspaceDatabaseTableColumn[];
  form: FormInstance<Record<string, unknown>>;
  onCancel: () => void;
  onSave: () => void;
};

function rowModalTitle(mode: RowFormMode): string {
  if (mode === 'edit') return 'Edit row';
  if (mode === 'copy') return 'Copy row';
  return 'Add row';
}

function isNumericColumn(type: string): boolean {
  const upperType = type.toUpperCase();
  return (
    upperType.includes('INT') ||
    upperType.includes('NUMERIC') ||
    upperType.includes('DECIMAL') ||
    upperType.includes('FLOAT') ||
    upperType.includes('DOUBLE') ||
    upperType.includes('REAL')
  );
}

function TableRowFormField({
  col,
  mode,
}: {
  col: WorkspaceDatabaseTableColumn;
  mode: RowFormMode;
}) {
  const skipRequired =
    col.nullable ||
    Boolean(col.default) ||
    (col.primary_key && (mode === 'insert' || mode === 'copy'));

  const rules = skipRequired ? [] : [{ required: true, message: `${col.name} is required` }];

  return (
    <Form.Item key={col.name} name={col.name} label={`${col.name} (${col.type})`} rules={rules}>
      {isNumericColumn(col.type) ? (
        <InputNumber style={{ width: '100%' }} placeholder={col.nullable ? 'NULL' : undefined} />
      ) : (
        <Input placeholder={col.nullable ? 'NULL' : undefined} />
      )}
    </Form.Item>
  );
}

export default function TableRowFormModal({
  open,
  mode,
  columns,
  form,
  onCancel,
  onSave,
}: Props) {
  return (
    <Modal
      title={rowModalTitle(mode)}
      open={open}
      onCancel={onCancel}
      onOk={onSave}
      okText="Save"
      width={560}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        {columns.map((col) => (
          <TableRowFormField key={col.name} col={col} mode={mode} />
        ))}
      </Form>
    </Modal>
  );
}
