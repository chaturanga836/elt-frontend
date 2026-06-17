'use client';

import React, { useEffect, useState } from 'react';
import { Input, Modal, Typography } from 'antd';

const { Text } = Typography;

type Props = {
  open: boolean;
  title: string;
  sql: string;
  confirmLabel?: string;
  loading?: boolean;
  danger?: boolean;
  editable?: boolean;
  onConfirm: (sql: string) => void;
  onCancel: () => void;
};

export default function SqlConfirmModal({
  open,
  title,
  sql,
  confirmLabel = 'Run SQL',
  loading = false,
  danger = false,
  editable = false,
  onConfirm,
  onCancel,
}: Props) {
  const [draft, setDraft] = useState(sql);

  useEffect(() => {
    if (open) setDraft(sql);
  }, [open, sql]);

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={() => onConfirm(draft)}
      okText={confirmLabel}
      okButtonProps={{ loading, danger }}
      cancelButtonProps={{ disabled: loading }}
      width={720}
      destroyOnHidden
    >
      <Text type="secondary">Review the SQL below before applying changes.</Text>
      <Input.TextArea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        readOnly={!editable}
        autoSize={{ minRows: 6, maxRows: 16 }}
        style={{ marginTop: 12, fontFamily: 'monospace', fontSize: 13 }}
      />
    </Modal>
  );
}
