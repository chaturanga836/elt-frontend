'use client';

import { Button, Input, Switch, Typography, Select, Tag } from 'antd';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { PipelineVarRow } from '@/lib/pipelineConnectionVariables';
import type { UpstreamOutputField } from '@/lib/pipelineNodeVariables';
import {
  formatInputTemplate,
  parseInputTemplateValue,
} from '@/lib/pipelineNodeVariables';
import { generateId } from '@/lib/generateId';

const { Text } = Typography;

type Props = {
  rows: PipelineVarRow[];
  onChange: (rows: PipelineVarRow[]) => void;
  onResetToConnectionDefaults: () => void;
  loading?: boolean;
  upstreamOutputs?: UpstreamOutputField[];
  upstreamNodeLabel?: string;
};

export default function PipelineConnectionVariablesEditor({
  rows,
  onChange,
  onResetToConnectionDefaults,
  loading,
  upstreamOutputs = [],
  upstreamNodeLabel,
}: Props) {
  const update = (uiId: string, patch: Partial<PipelineVarRow>) =>
    onChange(rows.map((r) => (r.uiId === uiId ? { ...r, ...patch } : r)));

  const remove = (uiId: string) => onChange(rows.filter((r) => r.uiId !== uiId));

  const add = () =>
    onChange([
      ...rows,
      { uiId: generateId(), key: '', value: '', enabled: true, defaultValue: '' },
    ]);

  const mapOptions = upstreamOutputs.map((field) => ({
    value: field.path,
    label: field.label,
    title: field.description,
  }));

  const handleMapFromUpstream = (uiId: string, path: string | null) => {
    if (!path) {
      update(uiId, { value: '' });
      return;
    }
    update(uiId, { value: formatInputTemplate(path) });
  };

  return (
    <div style={{ marginTop: 16 }}>
      {upstreamOutputs.length > 0 ? (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 6,
          }}
        >
          <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
            Previous node outputs
            {upstreamNodeLabel ? ` — ${upstreamNodeLabel}` : ''}
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {upstreamOutputs.map((field) => (
              <Tag key={field.path} title={field.description}>
                {field.label}
              </Tag>
            ))}
          </div>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
            Map each connection input variable below to one of these outputs. Values are saved as{' '}
            {'{{input.path}}'} templates resolved at run time.
          </Text>
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Text strong style={{ fontSize: 13 }}>
          Input variables (connection)
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
        Values apply only to this connection node on this pipeline. The saved REST connection is
        not modified. For Scrape URL, set <Text code>url</Text> to the page to fetch. Map from
        previous node outputs or enter a literal value.
      </Text>

      {rows.map((row) => {
        const mappedPath = parseInputTemplateValue(row.value);
        return (
          <div
            key={row.uiId}
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
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
              style={{ width: 100, flexShrink: 0 }}
              disabled={!row.enabled}
            />
            {upstreamOutputs.length > 0 ? (
              <Select
                allowClear
                placeholder="Map from output"
                value={mappedPath}
                onChange={(path) => handleMapFromUpstream(row.uiId, path ?? null)}
                options={mapOptions}
                style={{ width: 160, flexShrink: 0 }}
                disabled={!row.enabled}
                optionFilterProp="label"
                showSearch
              />
            ) : null}
            <Input
              placeholder={
                row.defaultValue ? `default: ${row.defaultValue}` : 'value or {{input.path}}'
              }
              value={row.value}
              onChange={(e) => update(row.uiId, { value: e.target.value })}
              style={{ flex: 1, minWidth: 140 }}
              disabled={!row.enabled}
            />
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              onClick={() => remove(row.uiId)}
            />
          </div>
        );
      })}

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
