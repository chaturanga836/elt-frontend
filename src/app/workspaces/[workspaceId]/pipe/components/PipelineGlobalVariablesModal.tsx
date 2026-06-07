'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import type { PipelineGlobalDef } from '@/lib/pipelineGlobals';
import { generateId } from '@/lib/generateId';

const { Text } = Typography;

type GlobalRow = PipelineGlobalDef & { uiId: string };

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PipelineGlobalVariablesModal({ open, onClose }: Props) {
  const pipelineGlobals = usePipelineStore((s) => s.pipelineGlobals);
  const setPipelineGlobals = usePipelineStore((s) => s.setPipelineGlobals);
  const [rows, setRows] = useState<GlobalRow[]>([]);

  useEffect(() => {
    if (!open) return;
    const variables = usePipelineStore.getState().pipelineGlobals.variables;
    setRows(
      variables.map((v) => ({
        ...v,
        uiId: generateId(),
      })),
    );
  }, [open]);

  const save = () => {
    setPipelineGlobals({
      variables: rows
        .filter((r) => r.key.trim())
        .map(({ uiId: _uiId, ...rest }) => ({
          key: rest.key.trim(),
          ...(rest.description ? { description: rest.description } : {}),
        })),
    });
    onClose();
  };

  return (
    <Modal
      title="Pipeline global variables"
      open={open}
      onCancel={onClose}
      onOk={save}
      width={640}
      destroyOnHidden
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Define keys that nodes can write to during the run. Use{' '}
        <Text code>global bindings</Text> on connection/script nodes to capture values.
        Later nodes read them via <Text code>input_data.globals.key</Text> or{' '}
        <Text code>{'{{globals.key}}'}</Text> in connection/DB templates.
      </Text>
      <Table
        size="small"
        pagination={false}
        dataSource={rows}
        rowKey="uiId"
        columns={[
          {
            title: 'Key',
            dataIndex: 'key',
            render: (_v, record) => (
              <Input
                value={record.key}
                placeholder="eth_balance"
                onChange={(e) =>
                  setRows(
                    rows.map((r) =>
                      r.uiId === record.uiId ? { ...r, key: e.target.value } : r,
                    ),
                  )
                }
              />
            ),
          },
          {
            title: 'Description',
            dataIndex: 'description',
            render: (_v, record) => (
              <Input
                value={record.description || ''}
                placeholder="Optional"
                onChange={(e) =>
                  setRows(
                    rows.map((r) =>
                      r.uiId === record.uiId ? { ...r, description: e.target.value } : r,
                    ),
                  )
                }
              />
            ),
          },
          {
            title: '',
            width: 48,
            render: (_v, record) => (
              <Button
                type="text"
                danger
                size="small"
                onClick={() => setRows(rows.filter((r) => r.uiId !== record.uiId))}
              >
                ×
              </Button>
            ),
          },
        ]}
      />
      <Button
        type="dashed"
        size="small"
        icon={<PlusOutlined />}
        style={{ marginTop: 8 }}
        onClick={() =>
          setRows([...rows, { uiId: generateId(), key: '', description: '' }])
        }
      >
        Add global variable
      </Button>
    </Modal>
  );
}
