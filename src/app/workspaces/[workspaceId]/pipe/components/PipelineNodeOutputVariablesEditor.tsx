'use client';

import { Button, Input, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { PipelineVariableDef } from '@/lib/pipelineNodeVariables';
import { generateId } from '@/lib/generateId';

const { Text } = Typography;

type OutputVarRow = PipelineVariableDef & { uiId: string };

type Props = {
  rows: OutputVarRow[];
  onChange: (rows: OutputVarRow[]) => void;
};

export function rowsFromOutputVariables(
  saved: PipelineVariableDef[] | undefined,
): OutputVarRow[] {
  if (!saved?.length) {
    return [{ uiId: generateId(), key: '', description: '' }];
  }
  return saved.map((v) => ({
    uiId: generateId(),
    key: v.key,
    description: v.description || '',
  }));
}

export function toOutputVariablePayload(rows: OutputVarRow[]): PipelineVariableDef[] {
  return rows
    .filter((r) => r.key.trim())
    .map((r) => ({
      key: r.key.trim(),
      ...(r.description?.trim() ? { description: r.description.trim() } : {}),
    }));
}

export default function PipelineNodeOutputVariablesEditor({ rows, onChange }: Props) {
  const update = (uiId: string, patch: Partial<OutputVarRow>) =>
    onChange(rows.map((r) => (r.uiId === uiId ? { ...r, ...patch } : r)));

  const remove = (uiId: string) => {
    const next = rows.filter((r) => r.uiId !== uiId);
    onChange(next.length ? next : [{ uiId: generateId(), key: '', description: '' }]);
  };

  const add = () =>
    onChange([...rows, { uiId: generateId(), key: '', description: '' }]);

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
        Declare keys your script returns (top-level fields in the return dict). Downstream
        connection nodes can map these to connection input variables.
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
          <Input
            placeholder="key e.g. url"
            value={row.key}
            onChange={(e) => update(row.uiId, { key: e.target.value })}
            style={{ width: 140, flexShrink: 0 }}
          />
          <Input
            placeholder="description (optional)"
            value={row.description}
            onChange={(e) => update(row.uiId, { description: e.target.value })}
            style={{ flex: 1 }}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            danger
            onClick={() => remove(row.uiId)}
          />
        </div>
      ))}

      <Button type="dashed" icon={<PlusOutlined />} size="small" onClick={add}>
        Add output variable
      </Button>
    </div>
  );
}

export type { OutputVarRow };
