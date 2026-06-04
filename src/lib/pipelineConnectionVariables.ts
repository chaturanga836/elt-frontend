import { generateId } from '@/lib/generateId';

export type PipelineVarRow = {
  uiId: string;
  key: string;
  value: string;
  enabled: boolean;
  /** From saved connection — shown as hint only */
  defaultValue?: string;
};

const TEMPLATE_KEY_RE = /\{\{(\w+)\}\}/g;

export function extractTemplateKeys(value: unknown, into: Set<string>): void {
  if (typeof value === 'string') {
    let match: RegExpExecArray | null;
    TEMPLATE_KEY_RE.lastIndex = 0;
    while ((match = TEMPLATE_KEY_RE.exec(value)) !== null) {
      into.add(match[1]);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => extractTemplateKeys(item, into));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((v) =>
      extractTemplateKeys(v, into),
    );
  }
}

type RuntimeEffective = {
  variables?: Array<{ key?: string; value?: string; enabled?: boolean }>;
  body?: unknown;
  params?: unknown;
};

export function rowsFromRuntimeEffective(
  effective: RuntimeEffective | undefined,
): PipelineVarRow[] {
  const keys = new Set<string>();
  const valueByKey = new Map<string, string>();

  for (const item of effective?.variables || []) {
    if (!item?.key || item.enabled === false) continue;
    keys.add(String(item.key));
    valueByKey.set(String(item.key), String(item.value ?? ''));
  }

  extractTemplateKeys(effective?.body, keys);
  extractTemplateKeys(effective?.params, keys);

  const sorted = [...keys].sort();
  return sorted.map((key) => ({
    uiId: generateId(),
    key,
    value: valueByKey.get(key) ?? '',
    enabled: true,
    defaultValue: valueByKey.get(key) ?? '',
  }));
}

export function rowsFromSavedPipelineVariables(
  saved: Array<{ key?: string; value?: string; enabled?: boolean }> | undefined,
  baseRows: PipelineVarRow[],
): PipelineVarRow[] {
  if (!saved?.length) return baseRows;
  const baseMap = new Map(baseRows.map((r) => [r.key, r]));
  const savedKeys = new Set(saved.map((s) => s.key).filter(Boolean) as string[]);

  const merged: PipelineVarRow[] = saved
    .filter((s) => s.key)
    .map((s) => {
      const key = String(s.key);
      const base = baseMap.get(key);
      return {
        uiId: generateId(),
        key,
        value: String(s.value ?? ''),
        enabled: s.enabled !== false,
        defaultValue: base?.defaultValue ?? '',
      };
    });

  for (const base of baseRows) {
    if (!savedKeys.has(base.key)) {
      merged.push({ ...base, uiId: generateId() });
    }
  }

  return merged.sort((a, b) => a.key.localeCompare(b.key));
}

export function toPipelineVariablePayload(rows: PipelineVarRow[]) {
  return rows
    .filter((r) => r.key.trim())
    .map((r) => ({
      key: r.key.trim(),
      value: r.value,
      enabled: r.enabled,
    }));
}
