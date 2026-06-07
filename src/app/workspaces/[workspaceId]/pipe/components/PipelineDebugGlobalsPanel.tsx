'use client';

import { Table, Tag, Typography } from 'antd';
import { formatValue } from '@/lib/pipelineDebugVariables';
import type { PipelineGlobalDef } from '@/lib/pipelineGlobals';

const { Text } = Typography;

type Props = {
  definedVariables: PipelineGlobalDef[];
  currentGlobals: Record<string, unknown>;
  changedKeys?: string[];
  title?: string;
};

export default function PipelineDebugGlobalsPanel({
  definedVariables,
  currentGlobals,
  changedKeys = [],
  title = 'Pipeline globals',
}: Props) {
  const changedSet = new Set(changedKeys);
  const definedKeys = definedVariables.map((v) => v.key).filter(Boolean);
  const allKeys = [...definedKeys].sort();

  const rows: Array<{
    key: string;
    description?: string;
    value: unknown;
    unset: boolean;
    changed: boolean;
  }> = allKeys.map((key) => {
    const def = definedVariables.find((v) => v.key === key);
    const hasValue = Object.prototype.hasOwnProperty.call(currentGlobals, key);
    return {
      key,
      description: def?.description,
      value: hasValue ? currentGlobals[key] : undefined,
      unset: !hasValue,
      changed: changedSet.has(key),
    };
  });

  if (!rows.length) {
    return (
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ display: 'block', marginBottom: 4 }}>
          {title}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          No pipeline globals defined. Add keys in the toolbar → Global variables, then bind
          outputs on connection/script nodes.
        </Text>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12, overflow: 'auto' }}>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        {title}
      </Text>
      <Table
        size="small"
        pagination={false}
        rowKey="key"
        dataSource={rows}
        columns={[
          {
            title: 'Key',
            dataIndex: 'key',
            width: 160,
            render: (_key: string, row) => (
              <span>
                <Text code>{row.key}</Text>
                {row.changed ? (
                  <Tag color="blue" style={{ marginLeft: 6, fontSize: 10 }}>
                    updated
                  </Tag>
                ) : null}
                {row.unset ? (
                  <Tag style={{ marginLeft: 6, fontSize: 10 }}>not set</Tag>
                ) : null}
              </span>
            ),
          },
          {
            title: 'Value',
            dataIndex: 'value',
            render: (value: unknown, row) =>
              row.unset ? (
                <Text type="secondary">—</Text>
              ) : (
                <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{formatValue(value)}</Text>
              ),
          },
          {
            title: 'Description',
            dataIndex: 'description',
            width: 140,
            render: (desc: string | undefined) =>
              desc ? (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {desc}
                </Text>
              ) : (
                '—'
              ),
          },
        ]}
      />
    </div>
  );
}
