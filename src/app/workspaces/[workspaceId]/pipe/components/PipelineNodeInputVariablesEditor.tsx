'use client';

import { Input, Switch, Tag, Typography } from 'antd';
import type { PipelineInputVariableDef, UpstreamOutputField } from '@/lib/pipelineNodeVariables';

const { Text } = Typography;

type InputVarRow = PipelineInputVariableDef & { uiId: string };

type Props = {
  rows: InputVarRow[];
  onChange: (rows: InputVarRow[]) => void;
  upstreamNodeLabel?: string;
  upstreamOutputs?: UpstreamOutputField[];
};

export default function PipelineNodeInputVariablesEditor({
  rows,
  onChange,
  upstreamNodeLabel,
  upstreamOutputs = [],
}: Props) {
  const update = (index: number, patch: Partial<InputVarRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  if (!rows.length && !upstreamOutputs.length) {
    return (
      <Text type="secondary" style={{ fontSize: 12 }}>
        Connect a node before this script (e.g. a connection node) to see input variables from its
        output.
      </Text>
    );
  }

  return (
    <div>
      {upstreamOutputs.length > 0 ? (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 12px',
            background: '#e6f4ff',
            border: '1px solid #91caff',
            borderRadius: 6,
          }}
        >
          <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
            From previous node{upstreamNodeLabel ? ` — ${upstreamNodeLabel}` : ''}
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {upstreamOutputs.map((field) => (
              <Tag key={field.path} title={field.description}>
                {field.label}
              </Tag>
            ))}
          </div>
        </div>
      ) : null}

      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
        These fields are available on <Text code>input_data</Text> when the script runs. Use{' '}
        <Text code>input_data.get(&apos;data&apos;)</Text> or{' '}
        <Text code>input_data.data</Text> for the response body from a connection node.
      </Text>

      {rows.map((row, index) => (
        <div
          key={row.uiId}
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 8,
            alignItems: 'center',
          }}
        >
          <Switch
            size="small"
            checked={row.enabled !== false}
            onChange={(enabled) => update(index, { enabled })}
            title="Include in script input hints"
          />
          <Input
            value={row.key}
            disabled
            style={{ width: 120, flexShrink: 0, fontFamily: 'monospace', fontSize: 12 }}
          />
          <Input
            value={row.source_path}
            disabled
            style={{ width: 120, flexShrink: 0, fontFamily: 'monospace', fontSize: 12 }}
            title="Path on input_data"
          />
          <Input
            placeholder="description"
            value={row.description || ''}
            onChange={(e) => update(index, { description: e.target.value })}
            style={{ flex: 1 }}
            disabled={row.enabled === false}
          />
        </div>
      ))}
    </div>
  );
}

export type { InputVarRow };
