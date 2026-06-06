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
  rowsFromOutputVariables,
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
  const rows = rowsFromOutputVariables(saved, DEFAULT_TASK_OUTPUT_VARIABLES);
  const hasCustom = rows.some((row) => !row.isDefault);
  if (hasCustom) return rows;
  return [...rows, { uiId: generateId(), key: '', description: '', isDefault: false }];
}

export function toTaskOutputVariablePayload(rows: OutputVarRow[]): PipelineVariableDef[] {
  return toOutputVariablePayload(rows);
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
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
        Default output <Text code>result</Text> is always included. Add more keys your script
        returns so downstream connection nodes can map them.
      </Text>
      <PipelineNodeOutputVariablesEditor rows={outputRows} onChange={onOutputChange} />
    </div>
  );
}

export type { InputVarRow, OutputVarRow };
