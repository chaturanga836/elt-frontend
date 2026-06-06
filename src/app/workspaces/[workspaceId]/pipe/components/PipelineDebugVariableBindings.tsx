'use client';

import { Table, Typography } from 'antd';
import type { VariableBindingRow } from '@/lib/pipelineDebugVariables';
import { formatValue } from '@/lib/pipelineDebugVariables';

const { Text } = Typography;

type Props = {
  title: string;
  rows: VariableBindingRow[];
  emptyText?: string;
};

export default function PipelineDebugVariableBindings({
  title,
  rows,
  emptyText = 'No variables configured for this step.',
}: Props) {
  if (!rows.length) {
    return (
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ display: 'block', marginBottom: 4 }}>
          {title}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {emptyText}
        </Text>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        {title}
      </Text>
      <Table
        size="small"
        pagination={false}
        rowKey={(row) => `${row.key}-${row.source ?? ''}`}
        dataSource={rows}
        columns={[
          {
            title: 'Key',
            dataIndex: 'key',
            width: 120,
            render: (key: string) => <Text code>{key}</Text>,
          },
          {
            title: 'Source / mapping',
            dataIndex: 'source',
            width: 180,
            render: (source: string | undefined) =>
              source ? <Text code style={{ fontSize: 11 }}>{source}</Text> : '—',
          },
          {
            title: 'Value',
            dataIndex: 'value',
            render: (value: unknown) => (
              <Text style={{ fontSize: 12, wordBreak: 'break-word' }}>{formatValue(value)}</Text>
            ),
          },
        ]}
      />
    </div>
  );
}
