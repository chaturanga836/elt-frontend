'use client';

import { Button, Input, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { PipelineVariableDef } from '@/lib/pipelineNodeVariables';
import { DEFAULT_TASK_OUTPUT_VARIABLES } from '@/lib/pipelineNodeVariables';
import { generateId } from '@/lib/generateId';

const { Text } = Typography;

type OutputVarRow = PipelineVariableDef & { uiId: string; isDefault?: boolean };

type Props = {
  rows: OutputVarRow[];
  onChange: (rows: OutputVarRow[]) => void;
  globalKeys?: string[];
};

export function rowsFromOutputVariables(
  saved: PipelineVariableDef[] | undefined,
  defaults: PipelineVariableDef[] = [],
): OutputVarRow[] {
  const defaultKeys = new Set(defaults.map((v) => v.key));
  const merged = mergeSavedOutputVariables(saved, defaults);
  if (!merged.length) {
    return [{ uiId: generateId(), key: '', description: '', isDefault: false }];
  }
  return merged.map((v) => ({
    uiId: generateId(),
    key: v.key,
    description: v.description || '',
    isDefault: defaultKeys.has(v.key),
  }));
}

export function mergeSavedOutputVariables(
  saved: PipelineVariableDef[] | undefined,
  defaults: PipelineVariableDef[],
): PipelineVariableDef[] {
  const seen = new Set<string>();
  const merged: PipelineVariableDef[] = [];
  for (const item of [...defaults, ...(saved || [])]) {
    const key = item.key?.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push({
      key,
      ...(item.description ? { description: item.description } : {}),
    });
  }
  return merged;
}

export function toOutputVariablePayload(
  rows: OutputVarRow[],
  globalKeys: string[] = [],
): PipelineVariableDef[] {
  const globalSet = new Set(globalKeys.map((k) => k.trim()).filter(Boolean));
  const seen = new Set<string>();
  const merged: PipelineVariableDef[] = [];
  for (const row of rows) {
    const key = row.key.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const exportGlobal = row.export_global === true || globalSet.has(key);
    merged.push({
      key,
      ...(row.description?.trim() ? { description: row.description.trim() } : {}),
      ...(exportGlobal ? { export_global: true } : {}),
    });
  }
  return merged;
}

export default function PipelineNodeOutputVariablesEditor({
  rows,
  onChange,
  globalKeys = [],
}: Props) {
  const update = (uiId: string, patch: Partial<OutputVarRow>) =>
    onChange(rows.map((r) => (r.uiId === uiId ? { ...r, ...patch } : r)));

  const remove = (uiId: string) => {
    const target = rows.find((r) => r.uiId === uiId);
    if (target?.isDefault) return;
    const next = rows.filter((r) => r.uiId !== uiId);
    onChange(next.length ? next : [{ uiId: generateId(), key: '', description: '', isDefault: false }]);
  };

  const add = () =>
    onChange([...rows, { uiId: generateId(), key: '', description: '', isDefault: false }]);

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
            disabled={row.isDefault}
          />
          <Input
            placeholder="description (optional)"
            value={row.description}
            onChange={(e) => update(row.uiId, { description: e.target.value })}
            style={{ flex: 1 }}
            disabled={row.isDefault}
          />
          {row.isDefault ? (
            <Text type="secondary" style={{ fontSize: 11, width: 32, flexShrink: 0 }}>
              default
            </Text>
          ) : (
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              onClick={() => remove(row.uiId)}
            />
          )}
        </div>
      ))}

      <Button type="dashed" icon={<PlusOutlined />} size="small" onClick={add}>
        Add output variable
      </Button>
    </div>
  );
}

export type { OutputVarRow };
