'use client';

import { Button, Input, Switch, Typography, Select, Tag } from 'antd';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { PipelineVarRow } from '@/lib/pipelineConnectionVariables';
import type { UpstreamOutputField } from '@/lib/pipelineNodeVariables';
import {
  formatInputTemplate,
  parseInputTemplateValue,
} from '@/lib/pipelineNodeVariables';
import { palette } from '@/constants/theme';
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
    label: `${field.label} → {{${field.path}}}`,
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
            Script / previous node outputs
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
            For each connection variable below, pick a script output (e.g.{' '}
            <Text code>result</Text>) or type <Text code>{'{{result}}'}</Text>. At run time
            the value comes from the previous step.
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
          Connection input variables
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

      {rows.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: upstreamOutputs.length
              ? '28px 100px 1fr 1fr 32px'
              : '28px 100px 1fr 32px',
            gap: '4px 8px',
            marginBottom: 8,
            alignItems: 'center',
            fontSize: 11,
            color: palette.textMuted,
          }}
        >
          <span />
          <span>Connection key</span>
          {upstreamOutputs.length > 0 ? <span>Map from output</span> : null}
          <span>Value (literal or {'{{result}}'})</span>
          <span />
        </div>
      ) : null}

      {rows.map((row) => {
        const mappedPath = parseInputTemplateValue(row.value);
        return (
          <div
            key={row.uiId}
            style={{
              display: 'grid',
              gridTemplateColumns: upstreamOutputs.length
                ? '28px 100px 1fr 1fr 32px'
                : '28px 100px 1fr 32px',
              gap: '4px 8px',
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
              style={{ width: '100%' }}
              disabled={!row.enabled}
            />
            {upstreamOutputs.length > 0 ? (
              <Select
                allowClear
                placeholder="e.g. result"
                value={mappedPath}
                onChange={(path) => handleMapFromUpstream(row.uiId, path ?? null)}
                options={mapOptions}
                style={{ width: '100%' }}
                disabled={!row.enabled}
                optionFilterProp="label"
                showSearch
              />
            ) : null}
            <Input
              placeholder={
                row.defaultValue
                  ? `default: ${row.defaultValue}`
                  : mappedPath
                    ? `{{${mappedPath}}}`
                    : 'literal or {{result}}'
              }
              value={row.value}
              onChange={(e) => update(row.uiId, { value: e.target.value })}
              style={{ width: '100%' }}
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
