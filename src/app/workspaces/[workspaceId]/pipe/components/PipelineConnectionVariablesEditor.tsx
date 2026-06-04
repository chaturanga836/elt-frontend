'use client';

import { Button, Input, Switch, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { PipelineVarRow } from '@/lib/pipelineConnectionVariables';
import { generateId } from '@/lib/generateId';

const { Text } = Typography;

type Props = {
  rows: PipelineVarRow[];
  onChange: (rows: PipelineVarRow[]) => void;
  onResetToConnectionDefaults: () => void;
  loading?: boolean;
};

export default function PipelineConnectionVariablesEditor({
  rows,
  onChange,
  onResetToConnectionDefaults,
  loading,
}: Props) {
  const update = (uiId: string, patch: Partial<PipelineVarRow>) =>
    onChange(rows.map((r) => (r.uiId === uiId ? { ...r, ...patch } : r)));

  const remove = (uiId: string) => onChange(rows.filter((r) => r.uiId !== uiId));

  const add = () =>
    onChange([
      ...rows,
      { uiId: generateId(), key: '', value: '', enabled: true, defaultValue: '' },
    ]);

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Text strong style={{ fontSize: 13 }}>
          Pipeline variables
        </Text>
        <Button
          type="link"
          size="small"
          icon={<ReloadOutlined />}
          onClick={onResetToConnectionDefaults}
          disabled={loading}
        >
          Reset to connection defaults
        </Button>
      </div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
        Values apply only to this connection node on this pipeline. The saved REST connection
        is not modified. For Scrape URL, set <Text code>url</Text> to the page to fetch (auth
        uses the connection bearer token — you do not need to paste the API key here). Use{' '}
        {'{{input.path}}'} when the previous step supplies data.
      </Text>

      {rows.map((row) => (
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
            checked={row.enabled}
            onChange={(enabled) => update(row.uiId, { enabled })}
            title="Enable for this pipeline run"
          />
          <Input
            placeholder="key"
            value={row.key}
            onChange={(e) => update(row.uiId, { key: e.target.value })}
            style={{ width: 120, flexShrink: 0 }}
            disabled={!row.enabled}
          />
          <Input
            placeholder={
              row.defaultValue
                ? `default: ${row.defaultValue}`
                : 'value'
            }
            value={row.value}
            onChange={(e) => update(row.uiId, { value: e.target.value })}
            style={{ flex: 1 }}
            disabled={!row.enabled}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            danger
            onClick={() => remove(row.uiId)}
          />
        </div>
      ))}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        size="small"
        onClick={add}
        disabled={loading}
      >
        Add variable
      </Button>
    </div>
  );
}
