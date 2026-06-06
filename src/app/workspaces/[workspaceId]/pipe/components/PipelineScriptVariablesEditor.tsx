'use client';

import { Divider, Typography } from 'antd';
import type { PipelineInputVariableDef, PipelineVariableDef, UpstreamOutputField } from '@/lib/pipelineNodeVariables';
import { DEFAULT_TASK_OUTPUT_VARIABLES } from '@/lib/pipelineNodeVariables';
import { generateId } from '@/lib/generateId';
import PipelineNodeInputVariablesEditor, {
  type InputVarRow,
} from './PipelineNodeInputVariablesEditor';
import PipelineNodeOutputVariablesEditor, {
  type OutputVarRow,
  toOutputVariablePayload,
} from './PipelineNodeOutputVariablesEditor';

const { Text } = Typography;

type Props = {
  inputRows: InputVarRow[];
  onInputChange: (rows: InputVarRow[]) => void;
  outputRows: OutputVarRow[];
  onOutputChange: (rows: OutputVarRow[]) => void;
  upstreamNodeLabel?: string;
  upstreamOutputs?: UpstreamOutputField[];
};

export function rowsFromInputVariables(
  saved: PipelineInputVariableDef[] | undefined,
  upstreamFields: UpstreamOutputField[],
): InputVarRow[] {
  if (saved?.length) {
    return saved.map((v) => ({
      uiId: generateId(),
      key: v.key,
      source_path: v.source_path,
      description: v.description || '',
      enabled: v.enabled !== false,
    }));
  }
  if (upstreamFields.length) {
    return upstreamFields.map((field) => ({
      uiId: generateId(),
      key: field.path,
      source_path: field.path,
      description: field.description || '',
      enabled: true,
    }));
  }
  return [];
}

export function toInputVariablePayload(rows: InputVarRow[]): PipelineInputVariableDef[] {
  return rows
    .filter((r) => r.key.trim() && r.source_path.trim())
    .map((r) => ({
      key: r.key.trim(),
      source_path: r.source_path.trim(),
      ...(r.description?.trim() ? { description: r.description.trim() } : {}),
      enabled: r.enabled !== false,
    }));
}

export function rowsFromTaskOutputVariables(
  saved: PipelineVariableDef[] | undefined,
): OutputVarRow[] {
  const defaultKeys = new Set(DEFAULT_TASK_OUTPUT_VARIABLES.map((v) => v.key));
  const custom = (saved || []).filter((v) => v.key?.trim() && !defaultKeys.has(v.key.trim()));
  if (!custom.length) {
    return [{ uiId: generateId(), key: '', description: '' }];
  }
  return custom.map((v) => ({
    uiId: generateId(),
    key: v.key,
    description: v.description || '',
  }));
}

export function toTaskOutputVariablePayload(
  customRows: OutputVarRow[],
): PipelineVariableDef[] {
  const custom = toOutputVariablePayload(customRows);
  const seen = new Set<string>();
  const merged: PipelineVariableDef[] = [];
  for (const item of [...DEFAULT_TASK_OUTPUT_VARIABLES, ...custom]) {
    const key = item.key.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

export default function PipelineScriptVariablesEditor({
  inputRows,
  onInputChange,
  outputRows,
  onOutputChange,
  upstreamNodeLabel,
  upstreamOutputs,
}: Props) {
  return (
    <div>
      <Text strong style={{ fontSize: 13 }}>
        Input variables
      </Text>
      <PipelineNodeInputVariablesEditor
        rows={inputRows}
        onChange={onInputChange}
        upstreamNodeLabel={upstreamNodeLabel}
        upstreamOutputs={upstreamOutputs}
      />

      <Divider style={{ margin: '16px 0' }} />

      <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
        Output variables
      </Text>
      <div style={{ marginBottom: 12 }}>
        {DEFAULT_TASK_OUTPUT_VARIABLES.map((item) => (
          <div
            key={item.key}
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 6,
              alignItems: 'center',
              opacity: 0.85,
            }}
          >
            <Text code style={{ width: 120, flexShrink: 0 }}>
              {item.key}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {item.description} (default)
            </Text>
          </div>
        ))}
      </div>

      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
        Add more keys your script returns. Downstream connection nodes can map these outputs.
      </Text>
      <PipelineNodeOutputVariablesEditor rows={outputRows} onChange={onOutputChange} />
    </div>
  );
}

export type { InputVarRow, OutputVarRow };
