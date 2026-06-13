'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
  notification,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';

const { Title, Text } = Typography;

type ColumnDef = {
  key: string;
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  defaultValue: string;
};

const COLUMN_TYPES = ['SERIAL', 'INTEGER', 'BIGINT', 'TEXT', 'VARCHAR(255)', 'BOOLEAN', 'TIMESTAMPTZ', 'JSONB'];

function buildCreateTableSql(tableName: string, columns: ColumnDef[]): string {
  const safeName = tableName.trim() || 'new_table';
  const lines = columns
    .filter((c) => c.name.trim())
    .map((c) => {
      let line = `  ${c.name.trim()} ${c.type}`;
      if (c.primaryKey && c.type !== 'SERIAL') line += ' PRIMARY KEY';
      if (!c.nullable) line += ' NOT NULL';
      if (c.defaultValue.trim()) line += ` DEFAULT ${c.defaultValue.trim()}`;
      return line;
    });

  if (lines.length === 0) {
    return `-- Add at least one column to generate DDL`;
  }

  return `CREATE TABLE IF NOT EXISTS ${safeName} (\n${lines.join(',\n')}\n);`;
}

let colKey = 0;
function newColumn(): ColumnDef {
  colKey += 1;
  return {
    key: `col-${colKey}`,
    name: '',
    type: 'TEXT',
    nullable: true,
    primaryKey: false,
    defaultValue: '',
  };
}

export default function TableBuilderPage() {
  const [tableName, setTableName] = useState('users');
  const [columns, setColumns] = useState<ColumnDef[]>([
    { key: 'col-1', name: 'id', type: 'SERIAL', nullable: false, primaryKey: true, defaultValue: '' },
    { key: 'col-2', name: 'name', type: 'TEXT', nullable: false, primaryKey: false, defaultValue: '' },
    { key: 'col-3', name: 'email', type: 'TEXT', nullable: false, primaryKey: false, defaultValue: '' },
  ]);

  const generatedSql = useMemo(() => buildCreateTableSql(tableName, columns), [tableName, columns]);

  const updateColumn = (key: string, patch: Partial<ColumnDef>) => {
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };

  const onApply = () => {
    notification.success({
      message: 'Table created (prototype mock)',
      description: `Applied DDL for "${tableName}"`,
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Table Builder
      </Title>
      <Text type="secondary">Design tables visually and preview generated SQL before applying.</Text>

      <Row gutter={24} style={{ marginTop: 16 }}>
        <Col xs={24} xl={14}>
          <Card title="Table definition">
            <Form layout="vertical">
              <Form.Item label="Table name">
                <Input value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="users" />
              </Form.Item>
            </Form>

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {columns.map((col) => (
                <Card key={col.key} size="small" type="inner">
                  <Row gutter={8} align="middle">
                    <Col span={6}>
                      <Input
                        placeholder="column"
                        value={col.name}
                        onChange={(e) => updateColumn(col.key, { name: e.target.value })}
                      />
                    </Col>
                    <Col span={6}>
                      <Select
                        style={{ width: '100%' }}
                        value={col.type}
                        options={COLUMN_TYPES.map((t) => ({ label: t, value: t }))}
                        onChange={(v) => updateColumn(col.key, { type: v })}
                      />
                    </Col>
                    <Col span={4}>
                      <Checkbox
                        checked={col.primaryKey}
                        onChange={(e) => updateColumn(col.key, { primaryKey: e.target.checked })}
                      >
                        PK
                      </Checkbox>
                    </Col>
                    <Col span={4}>
                      <Checkbox
                        checked={col.nullable}
                        onChange={(e) => updateColumn(col.key, { nullable: e.target.checked })}
                      >
                        Nullable
                      </Checkbox>
                    </Col>
                    <Col span={3}>
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => setColumns((prev) => prev.filter((c) => c.key !== col.key))}
                      />
                    </Col>
                  </Row>
                  <Input
                    style={{ marginTop: 8 }}
                    placeholder="Default (optional)"
                    value={col.defaultValue}
                    onChange={(e) => updateColumn(col.key, { defaultValue: e.target.value })}
                  />
                </Card>
              ))}
            </Space>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              style={{ marginTop: 16 }}
              onClick={() => setColumns((prev) => [...prev, newColumn()])}
            >
              Add column
            </Button>

            <div style={{ marginTop: 24 }}>
              <Button type="primary" onClick={onApply}>
                Apply table
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card title="Generated SQL">
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
              <Editor
                height="400px"
                defaultLanguage="sql"
                value={generatedSql}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
