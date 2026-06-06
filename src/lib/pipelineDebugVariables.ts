import type {
  PipelineInputVariableDef,
  PipelineVariableDef,
} from '@/lib/pipelineNodeVariables';
import {
  mergeTaskOutputVariables,
  parseInputTemplateValue,
  formatInputTemplate,
  resolveTemplateMapping,
} from '@/lib/pipelineNodeVariables';

export type VariableBindingRow = {
  key: string;
  source?: string;
  value: unknown;
  description?: string;
};

function unwrapPayload(data: unknown): unknown {
  if (data && typeof data === 'object' && !Array.isArray(data) && 'data' in (data as object)) {
    return (data as { data: unknown }).data;
  }
  return data;
}

function getPath(obj: unknown, path: string): unknown {
  if (!path || obj == null) return undefined;
  let cur: unknown = obj;
  for (const part of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    if (Array.isArray(cur)) {
      const idx = Number(part);
      if (!Number.isInteger(idx) || idx < 0 || idx >= cur.length) return undefined;
      cur = cur[idx];
      continue;
    }
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function formatValue(value: unknown): string {
  if (value === undefined) return '(missing)';
  if (value === null) return 'null';
  if (typeof value === 'string') return value.length > 120 ? `${value.slice(0, 120)}…` : value;
  if (typeof value === 'object') {
    try {
      const json = JSON.stringify(value);
      return json.length > 120 ? `${json.slice(0, 120)}…` : json;
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function buildScriptInputBindings(
  inputVariables: PipelineInputVariableDef[] | undefined,
  inputData: unknown,
): VariableBindingRow[] {
  const payload = unwrapPayload(inputData);
  const rows: VariableBindingRow[] = [];

  for (const item of inputVariables || []) {
    if (item.enabled === false || !item.key?.trim()) continue;
    const path = item.source_path?.trim() || item.key.trim();
    rows.push({
      key: item.key.trim(),
      source: path,
      value: getPath(payload, path),
      description: item.description,
    });
  }

  if (!rows.length && payload && typeof payload === 'object' && !Array.isArray(payload)) {
    for (const [key, value] of Object.entries(payload as Record<string, unknown>).slice(0, 12)) {
      rows.push({
        key,
        source: key,
        value,
        description: 'From previous node output',
      });
    }
  }

  return rows;
}

export function buildScriptOutputBindings(
  outputVariables: PipelineVariableDef[] | undefined,
  outputData: unknown,
): VariableBindingRow[] {
  const payload = unwrapPayload(outputData);
  const merged = mergeTaskOutputVariables(outputVariables);
  const rows: VariableBindingRow[] = [];
  const seen = new Set<string>();

  for (const item of merged) {
    const key = item.key.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const value =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)[key]
        : undefined;
    rows.push({
      key,
      value,
      description: item.description,
    });
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      if (seen.has(key)) continue;
      rows.push({
        key,
        value,
        description: 'Extra field from script return',
      });
    }
  }

  return rows;
}

export function buildConnectionVariableBindings(
  variables: Array<{ key?: string; value?: string; enabled?: boolean }> | undefined,
  inputData: unknown,
): VariableBindingRow[] {
  const payload = unwrapPayload(inputData);
  const rows: VariableBindingRow[] = [];

  for (const item of variables || []) {
    if (item.enabled === false || !item.key?.trim()) continue;
    const mapping = String(item.value ?? '');
    const templatePath = parseInputTemplateValue(mapping);
    const resolved = resolveTemplateMapping(mapping, payload);
    rows.push({
      key: item.key.trim(),
      source: templatePath ? formatInputTemplate(templatePath) : mapping || '(literal)',
      value: resolved,
    });
  }

  return rows;
}

export { formatValue };
