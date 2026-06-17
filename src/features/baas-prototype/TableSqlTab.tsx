'use client';

import React from 'react';
import { Space, Table, Typography } from 'antd';
import Editor from '@monaco-editor/react';
import type { SqlResultState } from '@/features/baas-prototype/tableDataPanelTypes';
import { formatCellValue } from '@/features/baas-prototype/tableDataPanelUtils';

const { Text } = Typography;

type Props = {
  sql: string;
  onSqlChange: (sql: string) => void;
  sqlResult: SqlResultState | null;
};

export default function TableSqlTab({ sql, onSqlChange, sqlResult }: Props) {
  const sqlResultColumns =
    sqlResult?.columns.map((name) => ({
      title: name,
      dataIndex: name,
      key: name,
      ellipsis: true,
      render: (value: unknown) => formatCellValue(value),
    })) ?? [];

  const sqlResultRows =
    sqlResult?.rows.map((row, index) => ({ key: `sql-${index}`, ...row })) ?? [];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <Editor
          height="240px"
          defaultLanguage="sql"
          value={sql}
          onChange={(value) => onSqlChange(value ?? '')}
          options={{ minimap: { enabled: false }, fontSize: 13 }}
        />
      </div>
      {sqlResult && (
        <div>
          <Text type="secondary">
            {sqlResult.statementType === 'select'
              ? `${sqlResult.rowCount ?? 0} row(s)${sqlResult.truncated ? ' (truncated)' : ''}`
              : `${sqlResult.rowsAffected ?? 0} row(s) affected`}
          </Text>
          {sqlResult.statementType === 'select' && sqlResult.columns.length > 0 && (
            <Table
              size="small"
              style={{ marginTop: 8 }}
              columns={sqlResultColumns}
              dataSource={sqlResultRows}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          )}
        </div>
      )}
    </Space>
  );
}
