'use client';

import { Button, Input, Select, Table, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { GlobalBindingDef } from '@/lib/pipelineGlobals';
import type { UpstreamOutputField } from '@/lib/pipelineNodeVariables';
import { generateId } from '@/lib/generateId';

const { Text } = Typography;

export type GlobalBindingRow = GlobalBindingDef & { uiId: string };

export function rowsFromGlobalBindings(
  saved: GlobalBindingDef[] | undefined,
): GlobalBindingRow[] {
  return (saved || []).map((row) => ({
    uiId: generateId(),
    key: row.key || '',
    source_path: row.source_path || '',
  }));
}

export function toGlobalBindingPayload(rows: GlobalBindingRow[]): GlobalBindingDef[] {
  return rows
    .filter((r) => r.key.trim())
    .map((r) => ({
      key: r.key.trim(),
      source_path: (r.source_path || r.key).trim(),
    }));
}

type Props = {
  rows: GlobalBindingRow[];
  onChange: (rows: GlobalBindingRow[]) => void;
  globalKeys: string[];
  upstreamFields: UpstreamOutputField[];
  title?: string;
};

export default function PipelineNodeGlobalBindingsEditor({
  rows,
  onChange,
  globalKeys,
  upstreamFields,
  title = 'Write to pipeline globals',
}: Props) {
  const pathOptions = upstreamFields.map((f) => ({
    value: f.path,
    label: f.label || f.path,
  }));

  const keyOptions = globalKeys.map((k) => ({ value: k, label: k }));

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
        {title} — values persist for all later nodes and appear on{' '}
        <Text code>input_data.globals</Text> / <Text code>{'{{globals.key}}'}</Text> in templates.
      </Text>
      <Table
        size="small"
        pagination={false}
        dataSource={rows}
        rowKey="uiId"
        columns={[
          {
            title: 'Global key',
            dataIndex: 'key',
            render: (_v, record) => (
              <Select
                style={{ width: '100%' }}
                placeholder="Select or type key"
                mode={undefined}
                showSearch
                allowClear
                options={keyOptions}
                value={record.key || undefined}
                onChange={(val) =>
                  onChange(
                    rows.map((r) =>
                      r.uiId === record.uiId ? { ...r, key: val || '' } : r,
                    ),
                  )
                }
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <div style={{ padding: 8 }}>
                      <Input
                        placeholder="Custom key"
                        onPressEnter={(e) => {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (!val) return;
                          onChange(
                            rows.map((r) =>
                              r.uiId === record.uiId ? { ...r, key: val } : r,
                            ),
                          );
                        }}
                      />
                    </div>
                  </>
                )}
              />
            ),
          },
          {
            title: 'From output path',
            dataIndex: 'source_path',
            render: (_v, record) => (
              <Select
                style={{ width: '100%' }}
                showSearch
                allowClear
                placeholder="e.g. data or result"
                options={pathOptions}
                value={record.source_path || undefined}
                onChange={(val) =>
                  onChange(
                    rows.map((r) =>
                      r.uiId === record.uiId ? { ...r, source_path: val || '' } : r,
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
                onClick={() => onChange(rows.filter((r) => r.uiId !== record.uiId))}
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
          onChange([
            ...rows,
            { uiId: generateId(), key: globalKeys[0] || '', source_path: '' },
          ])
        }
      >
        Add global binding
      </Button>
    </div>
  );
}
