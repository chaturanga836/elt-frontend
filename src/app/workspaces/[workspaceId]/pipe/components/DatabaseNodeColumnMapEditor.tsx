'use client';

import { Input, Select, Spin, Table, Typography } from 'antd';
import type { DbColumnMapEntry, DbColumnMapMode, DbColumnMapUi } from '@/lib/dbColumnMap';
import { SKIP_COLUMN_MAP_ENTRY } from '@/lib/dbColumnMap';

const { Text } = Typography;

const MODE_OPTIONS: { value: DbColumnMapMode; label: string }[] = [
  { value: 'skip', label: 'Skip' },
  { value: 'field', label: 'Source field' },
  { value: 'literal', label: 'Hardcoded' },
  { value: 'global', label: 'Global variable' },
];

type Props = {
  columns: string[];
  value: DbColumnMapUi;
  onChange: (map: DbColumnMapUi) => void;
  globalKeys?: string[];
  loading?: boolean;
  error?: string | null;
};

function entryForColumn(value: DbColumnMapUi, column: string): DbColumnMapEntry {
  return value[column] ?? SKIP_COLUMN_MAP_ENTRY;
}

function updateEntry(
  value: DbColumnMapUi,
  column: string,
  entry: DbColumnMapEntry,
  onChange: (map: DbColumnMapUi) => void,
) {
  onChange({ ...value, [column]: entry });
}

export default function DatabaseNodeColumnMapEditor({
  columns,
  value,
  onChange,
  globalKeys = [],
  loading = false,
  error = null,
}: Props) {
  const rows = columns.map((column) => ({
    column,
    entry: entryForColumn(value, column),
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
        For each table column, choose <strong>Source field</strong> (from previous node{' '}
        <Text code>records</Text>), <strong>Hardcoded</strong> (fixed value), or{' '}
        <strong>Global variable</strong> (pipeline global at runtime). Use Skip to leave the
        column unset.
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
            width: 140,
            render: (column: string) => <Text code>{column}</Text>,
          },
          {
            title: 'Mapping',
            dataIndex: 'entry',
            width: 150,
            render: (entry: DbColumnMapEntry, row) => (
              <Select
                size="small"
                style={{ width: '100%' }}
                value={entry.mode}
                options={MODE_OPTIONS}
                onChange={(mode: DbColumnMapMode) => {
                  if (mode === 'skip') {
                    updateEntry(value, row.column, { mode: 'skip' }, onChange);
                  } else if (mode === 'field') {
                    updateEntry(
                      value,
                      row.column,
                      { mode: 'field', source: entry.mode === 'field' ? entry.source : '' },
                      onChange,
                    );
                  } else if (mode === 'literal') {
                    updateEntry(
                      value,
                      row.column,
                      { mode: 'literal', value: entry.mode === 'literal' ? entry.value : '' },
                      onChange,
                    );
                  } else {
                    updateEntry(
                      value,
                      row.column,
                      { mode: 'global', key: entry.mode === 'global' ? entry.key : '' },
                      onChange,
                    );
                  }
                }}
              />
            ),
          },
          {
            title: 'Value',
            dataIndex: 'entry',
            render: (entry: DbColumnMapEntry, row) => {
              if (entry.mode === 'skip') {
                return <Text type="secondary">—</Text>;
              }
              if (entry.mode === 'field') {
                return (
                  <Input
                    size="small"
                    placeholder="e.g. coin_id"
                    value={entry.source}
                    onChange={(e) =>
                      updateEntry(
                        value,
                        row.column,
                        { mode: 'field', source: e.target.value },
                        onChange,
                      )
                    }
                    allowClear
                  />
                );
              }
              if (entry.mode === 'literal') {
                return (
                  <Input
                    size="small"
                    placeholder="e.g. https://example.com/eth"
                    value={entry.value}
                    onChange={(e) =>
                      updateEntry(
                        value,
                        row.column,
                        { mode: 'literal', value: e.target.value },
                        onChange,
                      )
                    }
                    allowClear
                  />
                );
              }
              return (
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  placeholder="Select global"
                  value={entry.key || undefined}
                  allowClear
                  showSearch
                  options={globalKeys.map((key) => ({ value: key, label: key }))}
                  notFoundContent={
                    globalKeys.length ? 'No match' : 'Define globals in toolbar first'
                  }
                  onChange={(key) =>
                    updateEntry(
                      value,
                      row.column,
                      { mode: 'global', key: key ?? '' },
                      onChange,
                    )
                  }
                />
              );
            },
          },
        ]}
      />
    </div>
  );
}
