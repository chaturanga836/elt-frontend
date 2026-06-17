import type { RowRecord } from '@/features/baas-prototype/tableDataPanelTypes';

export function rowKeyFor(index: number, offset: number): string {
  return `row-${offset + index}`;
}

export function toRowRecord(row: Record<string, unknown>, index: number, offset: number): RowRecord {
  return { ...row, __rowKey: rowKeyFor(index, offset) };
}

export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
