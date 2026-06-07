'use client';

import { Input, Spin, Table, Typography } from 'antd';
import type { DbColumnMapUi } from '@/lib/dbColumnMap';

const { Text } = Typography;

type Props = {
  columns: string[];
  value: DbColumnMapUi;
  onChange: (map: DbColumnMapUi) => void;
  loading?: boolean;
  error?: string | null;
};

export default function DatabaseNodeColumnMapEditor({
  columns,
  value,
  onChange,
  loading = false,
  error = null,
}: Props) {
  const rows = columns.map((column) => ({
    column,
    source: value[column] ?? null,
  }));

  if (loading) {
    return (
      <div style={{ padding: '12px 0', textAlign: 'center' }}>
        <Spin size="small" /> <Text type="secondary">Loading columns…</Text>
      </div>
    );
  }

  if (error) {
    return (
      <Text type="danger" style={{ fontSize: 12 }}>
        {error}
      </Text>
    );
  }

  if (!columns.length) {
    return (
      <Text type="secondary" style={{ fontSize: 12 }}>
        Select a target table to generate the column map.
      </Text>
    );
  }

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
        Table columns are listed automatically. Enter the matching field name from the previous
        node input for each column (leave empty to skip on insert/update).
      </Text>
      <Table
        size="small"
        pagination={false}
        rowKey="column"
        dataSource={rows}
        columns={[
          {
            title: 'Table column',
            dataIndex: 'column',
            width: 180,
            render: (column: string) => <Text code>{column}</Text>,
          },
          {
            title: 'Source field',
            dataIndex: 'source',
            render: (_source: string | null, row) => (
              <Input
                placeholder="null"
                value={row.source ?? ''}
                onChange={(e) => {
                  const next = e.target.value.trim();
                  onChange({
                    ...value,
                    [row.column]: next ? next : null,
                  });
                }}
                allowClear
              />
            ),
          },
        ]}
      />
    </div>
  );
}
