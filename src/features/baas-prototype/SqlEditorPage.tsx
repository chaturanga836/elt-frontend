'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Row, Select, Space, Table, Tag, Typography, notification } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { palette } from '@/constants/theme';

const { Title, Text } = Typography;

const SQL_TEMPLATES: Record<string, string> = {
  select: `SELECT id, name, created_at
FROM users
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 100;`,
  insert: `INSERT INTO users (name, email, status)
VALUES ('Jane Doe', 'jane@example.com', 'active');`,
  create_table: `CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  status     TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);`,
  create_index: `CREATE INDEX IF NOT EXISTS idx_users_status
ON users (status);`,
  alter_table: `ALTER TABLE users
ADD COLUMN last_login_at TIMESTAMPTZ;`,
};

const MOCK_COLUMNS = [
  { title: 'id', dataIndex: 'id', key: 'id', width: 80 },
  { title: 'name', dataIndex: 'name', key: 'name' },
  { title: 'email', dataIndex: 'email', key: 'email' },
  { title: 'status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color="green">{v}</Tag> },
];

const MOCK_ROWS = [
  { key: 1, id: 1, name: 'Jane Doe', email: 'jane@example.com', status: 'active' },
  { key: 2, id: 2, name: 'John Smith', email: 'john@example.com', status: 'active' },
  { key: 3, id: 3, name: 'Alex Lee', email: 'alex@example.com', status: 'inactive' },
];

export default function SqlEditorPage() {
  const [template, setTemplate] = useState('select');
  const [sql, setSql] = useState(SQL_TEMPLATES.select);
  const [running, setRunning] = useState(false);
  const [showResults, setShowResults] = useState(true);

  const templateOptions = useMemo(
    () => [
      { label: 'SELECT', value: 'select' },
      { label: 'INSERT', value: 'insert' },
      { label: 'CREATE TABLE', value: 'create_table' },
      { label: 'CREATE INDEX', value: 'create_index' },
      { label: 'ALTER TABLE', value: 'alter_table' },
    ],
    [],
  );

  const onTemplateChange = (value: string) => {
    setTemplate(value);
    setSql(SQL_TEMPLATES[value] ?? '');
  };

  const onRun = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setShowResults(true);
      notification.success({ message: 'Query executed (prototype mock)', description: '3 rows returned in 42ms' });
    }, 600);
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        SQL Editor
      </Title>
      <Text type="secondary">Run queries against your project database. Prototype — results are mock data.</Text>

      <Card style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={24} lg={6}>
            <Text strong>Template</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={template}
              options={templateOptions}
              onChange={onTemplateChange}
            />
          </Col>
          <Col xs={24} lg={18}>
            <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 28 }}>
              <Button type="primary" icon={<PlayCircleOutlined />} loading={running} onClick={onRun}>
                Run
              </Button>
            </Space>
          </Col>
        </Row>

        <div
          style={{
            marginTop: 16,
            border: `1px solid ${palette.borderSubtle}`,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <Editor
            height="280px"
            defaultLanguage="sql"
            theme="vs-dark"
            value={sql}
            onChange={(v) => setSql(v ?? '')}
            options={{ minimap: { enabled: false }, fontSize: 13 }}
          />
        </div>
      </Card>

      {showResults && (
        <Card title="Results" style={{ marginTop: 16 }} extra={<Text type="secondary">3 rows · 42ms</Text>}>
          <Table columns={MOCK_COLUMNS} dataSource={MOCK_ROWS} pagination={false} size="small" />
        </Card>
      )}
    </div>
  );
}
