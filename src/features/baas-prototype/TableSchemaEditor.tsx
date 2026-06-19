'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AutoComplete,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
  notification,
} from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import {
  WorkspaceDatabaseService,
  WorkspaceDatabaseTableDetail,
} from '@/services/workspaceDatabase.service';
import { getApiErrorMessage } from '@/lib/formatApiError';
import { palette } from '@/constants/theme';
import {
  COLUMN_BASE_TYPES,
  ColumnBaseType,
  ColumnDef,
  ForeignKeyDef,
  IndexDef,
  ON_DELETE_OPTIONS,
  TYPE_HAS_LENGTH,
  TableSchemaState,
  buildDdl,
  defaultCreateState,
  newColumn,
  newForeignKey,
  newIndex,
  stateFromTableDetail,
  validateSchemaState,
} from './tableSchemaUtils';

const { Title, Text } = Typography;

const DEFAULT_PRESETS = [
  { label: 'now()', value: 'now()' },
  { label: "'active'", value: "'active'" },
  { label: 'true', value: 'true' },
  { label: 'false', value: 'false' },
  { label: '0', value: '0' },
  { label: "''", value: "''" },
  { label: 'gen_random_uuid()', value: 'gen_random_uuid()' },
];

export type TableSchemaEditorProps = {
  mode: 'create' | 'edit';
  workspaceId: number;
  databaseId: number;
  schemaName: string;
  initialTable?: WorkspaceDatabaseTableDetail;
  availableTables: string[];
  onCancel: () => void;
  onSaved: (tableName: string) => void;
  fullPage?: boolean;
};

export default function TableSchemaEditor({
  mode,
  workspaceId,
  databaseId,
  schemaName,
  initialTable,
  availableTables,
  onCancel,
  onSaved,
  fullPage = false,
}: TableSchemaEditorProps) {
  const [state, setState] = useState<TableSchemaState>(() =>
    mode === 'edit' && initialTable ? stateFromTableDetail(initialTable) : defaultCreateState(),
  );
  const [applying, setApplying] = useState(false);
  const [refColumnsByTable, setRefColumnsByTable] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (mode === 'edit' && initialTable) {
      setState(stateFromTableDetail(initialTable));
    }
  }, [mode, initialTable]);

  const columnNames = useMemo(
    () => state.columns.filter((c) => c.name.trim()).map((c) => c.name.trim()),
    [state.columns],
  );

  const generatedSql = useMemo(
    () => buildDdl(mode, schemaName, state, initialTable),
    [mode, schemaName, state, initialTable],
  );

  const updateColumn = (key: string, patch: Partial<ColumnDef>) => {
    setState((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => (c.key === key ? { ...c, ...patch } : c)),
    }));
  };

  const loadRefColumns = useCallback(
    async (tableName: string) => {
      if (!tableName || refColumnsByTable[tableName]) return;
      try {
        const detail = await WorkspaceDatabaseService.getTableDetail(
          workspaceId,
          databaseId,
          tableName,
        );
        setRefColumnsByTable((prev) => ({
          ...prev,
          [tableName]: detail.columns.map((c) => c.name),
        }));
      } catch (err) {
        notification.error({
          message: 'Could not load referenced table columns',
          description: getApiErrorMessage(err),
        });
      }
    },
    [workspaceId, databaseId, refColumnsByTable],
  );

  const onApply = async () => {
    const error = validateSchemaState(state);
    if (error) {
      notification.warning({ message: error });
      return;
    }
    if (mode === 'edit' && generatedSql.startsWith('-- No changes')) {
      notification.info({ message: 'No changes to apply' });
      return;
    }

    setApplying(true);
    try {
      await WorkspaceDatabaseService.executeDdl(workspaceId, databaseId, generatedSql);
      notification.success({
        message: mode === 'create' ? 'Table created' : 'Table updated',
        description: state.tableName.trim(),
      });
      onSaved(state.tableName.trim());
    } catch (err) {
      notification.error({
        message: 'Could not apply DDL',
        description: getApiErrorMessage(err),
      });
    } finally {
      setApplying(false);
    }
  };

  const containerStyle: React.CSSProperties = fullPage
    ? { padding: 24, minHeight: 'calc(100vh - 120px)' }
    : {
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 220px)',
        height: '100%',
      };

  return (
    <div style={containerStyle}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={onCancel}>
            {fullPage ? 'Cancel' : 'Back'}
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {mode === 'create' ? 'Create table' : 'Edit table'}
          </Title>
          <Text type="secondary">{schemaName}</Text>
        </Space>
        <Button type="primary" loading={applying} onClick={onApply}>
          {mode === 'create' ? 'Apply table' : 'Save changes'}
        </Button>
      </Flex>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <Card size="small" title="Table definition" style={{ marginBottom: 16 }}>
          <Form layout="vertical">
            <Form.Item label="Table name" style={{ marginBottom: 0, maxWidth: 360 }}>
              <Input
                value={state.tableName}
                disabled={mode === 'edit'}
                onChange={(e) => setState((prev) => ({ ...prev, tableName: e.target.value }))}
                placeholder="users"
              />
            </Form.Item>
          </Form>
        </Card>

        <Card size="small" title="Columns" style={{ marginBottom: 16 }}>
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <Row gutter={8} style={{ fontSize: 12, color: palette.textMuted, padding: '0 4px' }}>
              <Col span={4}>Column</Col>
              <Col span={4}>Type</Col>
              <Col span={3}>Length</Col>
              <Col span={2}>PK</Col>
              <Col span={2}>Null</Col>
              <Col span={5}>Default</Col>
              <Col span={2} />
            </Row>
            {state.columns.map((col) => (
              <Card key={col.key} size="small" type="inner">
                <Row gutter={8} align="middle">
                  <Col span={4}>
                    <Input
                      placeholder="column"
                      value={col.name}
                      onChange={(e) => updateColumn(col.key, { name: e.target.value })}
                    />
                  </Col>
                  <Col span={4}>
                    <Select
                      style={{ width: '100%' }}
                      value={col.baseType}
                      options={COLUMN_BASE_TYPES.map((t) => ({ label: t, value: t }))}
                      onChange={(v: ColumnBaseType) => {
                        const patch: Partial<ColumnDef> = { baseType: v };
                        if (v === 'VARCHAR') patch.length = col.length ?? 255;
                        if (v === 'CHAR') patch.length = col.length ?? 1;
                        if (v === 'NUMERIC') {
                          patch.precision = col.precision ?? 10;
                          patch.scale = col.scale ?? 0;
                        }
                        updateColumn(col.key, patch);
                      }}
                    />
                  </Col>
                  <Col span={3}>
                    {TYPE_HAS_LENGTH[col.baseType] ? (
                      col.baseType === 'NUMERIC' ? (
                        <Space.Compact style={{ width: '100%' }}>
                          <InputNumber
                            min={1}
                            max={1000}
                            style={{ width: '50%' }}
                            placeholder="p"
                            value={col.precision}
                            onChange={(v) => updateColumn(col.key, { precision: v ?? undefined })}
                          />
                          <InputNumber
                            min={0}
                            max={1000}
                            style={{ width: '50%' }}
                            placeholder="s"
                            value={col.scale}
                            onChange={(v) => updateColumn(col.key, { scale: v ?? 0 })}
                          />
                        </Space.Compact>
                      ) : (
                        <InputNumber
                          min={1}
                          max={10000}
                          style={{ width: '100%' }}
                          value={col.length}
                          onChange={(v) => updateColumn(col.key, { length: v ?? undefined })}
                        />
                      )
                    ) : (
                      <Text type="secondary">—</Text>
                    )}
                  </Col>
                  <Col span={2}>
                    <Checkbox
                      checked={col.primaryKey}
                      onChange={(e) => updateColumn(col.key, { primaryKey: e.target.checked })}
                    />
                  </Col>
                  <Col span={2}>
                    <Checkbox
                      checked={col.nullable}
                      onChange={(e) => updateColumn(col.key, { nullable: e.target.checked })}
                    />
                  </Col>
                  <Col span={5}>
                    <AutoComplete
                      style={{ width: '100%' }}
                      placeholder="e.g. now()"
                      value={col.defaultValue}
                      options={DEFAULT_PRESETS}
                      onChange={(v) => updateColumn(col.key, { defaultValue: v })}
                      filterOption={(input, option) =>
                        (option?.value?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Col>
                  <Col span={2}>
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          columns: prev.columns.filter((c) => c.key !== col.key),
                        }))
                      }
                    />
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            style={{ marginTop: 16 }}
            onClick={() => setState((prev) => ({ ...prev, columns: [...prev.columns, newColumn()] }))}
          >
            Add column
          </Button>
        </Card>

        <Card size="small" title="Indexes" style={{ marginBottom: 16 }}>
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            {state.indexes.map((idx) => (
              <IndexRow
                key={idx.key}
                index={idx}
                columnNames={columnNames}
                onChange={(patch) =>
                  setState((prev) => ({
                    ...prev,
                    indexes: prev.indexes.map((i) => (i.key === idx.key ? { ...i, ...patch } : i)),
                  }))
                }
                onDelete={() =>
                  setState((prev) => ({
                    ...prev,
                    indexes: prev.indexes.filter((i) => i.key !== idx.key),
                  }))
                }
              />
            ))}
          </Space>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            style={{ marginTop: 16 }}
            onClick={() => setState((prev) => ({ ...prev, indexes: [...prev.indexes, newIndex()] }))}
          >
            Add index
          </Button>
        </Card>

        <Card size="small" title="Foreign keys" style={{ marginBottom: 16 }}>
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            {state.foreignKeys.map((fk) => (
              <ForeignKeyRow
                key={fk.key}
                fk={fk}
                columnNames={columnNames}
                availableTables={availableTables.filter((t) => t !== state.tableName)}
                refColumns={refColumnsByTable[fk.refTable] ?? []}
                onRefTableChange={(table) => void loadRefColumns(table)}
                onChange={(patch) =>
                  setState((prev) => ({
                    ...prev,
                    foreignKeys: prev.foreignKeys.map((f) =>
                      f.key === fk.key ? { ...f, ...patch } : f,
                    ),
                  }))
                }
                onDelete={() =>
                  setState((prev) => ({
                    ...prev,
                    foreignKeys: prev.foreignKeys.filter((f) => f.key !== fk.key),
                  }))
                }
              />
            ))}
          </Space>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            style={{ marginTop: 16 }}
            onClick={() =>
              setState((prev) => ({ ...prev, foreignKeys: [...prev.foreignKeys, newForeignKey()] }))
            }
          >
            Add foreign key
          </Button>
        </Card>

        <Collapse
          items={[
            {
              key: 'sql',
              label: 'Generated SQL',
              children: (
                <div
                  style={{
                    border: `1px solid ${palette.borderSubtle}`,
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <Editor
                    height="280px"
                    defaultLanguage="sql"
                    theme="vs-dark"
                    value={generatedSql}
                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

function IndexRow({
  index,
  columnNames,
  onChange,
  onDelete,
}: {
  index: IndexDef;
  columnNames: string[];
  onChange: (patch: Partial<IndexDef>) => void;
  onDelete: () => void;
}) {
  return (
    <Card size="small" type="inner">
      <Row gutter={8} align="middle">
        <Col span={6}>
          <Input
            placeholder="idx_name"
            value={index.name}
            disabled={index.existing}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </Col>
        <Col span={10}>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Columns"
            value={index.columns}
            disabled={index.existing}
            options={columnNames.map((n) => ({ label: n, value: n }))}
            onChange={(v) => onChange({ columns: v })}
          />
        </Col>
        <Col span={4}>
          <Checkbox
            checked={index.unique}
            disabled={index.existing}
            onChange={(e) => onChange({ unique: e.target.checked })}
          >
            Unique
          </Checkbox>
        </Col>
        <Col span={2}>
          {!index.existing && (
            <Button danger type="text" icon={<DeleteOutlined />} onClick={onDelete} />
          )}
        </Col>
      </Row>
    </Card>
  );
}

function ForeignKeyRow({
  fk,
  columnNames,
  availableTables,
  refColumns,
  onRefTableChange,
  onChange,
  onDelete,
}: {
  fk: ForeignKeyDef;
  columnNames: string[];
  availableTables: string[];
  refColumns: string[];
  onRefTableChange: (table: string) => void;
  onChange: (patch: Partial<ForeignKeyDef>) => void;
  onDelete: () => void;
}) {
  return (
    <Card size="small" type="inner">
      <Row gutter={8} align="middle">
        <Col span={5}>
          <Input
            placeholder="fk_name"
            value={fk.name}
            disabled={fk.existing}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </Col>
        <Col span={4}>
          <Select
            style={{ width: '100%' }}
            placeholder="Local column"
            value={fk.localColumn || undefined}
            disabled={fk.existing}
            options={columnNames.map((n) => ({ label: n, value: n }))}
            onChange={(v) => onChange({ localColumn: v })}
          />
        </Col>
        <Col span={4}>
          <Select
            style={{ width: '100%' }}
            placeholder="Ref table"
            value={fk.refTable || undefined}
            disabled={fk.existing}
            showSearch
            options={availableTables.map((t) => ({ label: t, value: t }))}
            onChange={(v) => {
              onChange({ refTable: v, refColumn: '' });
              onRefTableChange(v);
            }}
          />
        </Col>
        <Col span={4}>
          <Select
            style={{ width: '100%' }}
            placeholder="Ref column"
            value={fk.refColumn || undefined}
            disabled={fk.existing}
            options={refColumns.map((c) => ({ label: c, value: c }))}
            onChange={(v) => onChange({ refColumn: v })}
          />
        </Col>
        <Col span={5}>
          <Select
            style={{ width: '100%' }}
            value={fk.onDelete}
            disabled={fk.existing}
            options={ON_DELETE_OPTIONS.map((o) => ({ label: o, value: o }))}
            onChange={(v) => onChange({ onDelete: v })}
          />
        </Col>
        <Col span={2}>
          {!fk.existing && (
            <Button danger type="text" icon={<DeleteOutlined />} onClick={onDelete} />
          )}
        </Col>
      </Row>
    </Card>
  );
}
