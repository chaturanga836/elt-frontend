'use client';

import React, { useMemo, useState } from 'react';
import { Button, Modal, Space, Typography, notification } from 'antd';
import {
  CopyOutlined,
  FullscreenOutlined,
  CompressOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { formatJsonBlock } from './runDetailUtils';

const { Text } = Typography;

type Props = {
  label: string;
  data: unknown;
  /** Plain text (tracebacks) vs JSON formatting */
  language?: 'json' | 'plaintext';
  inlineMaxHeight?: number;
  emptyText?: string;
};

function toEditorValue(data: unknown, language: 'json' | 'plaintext'): string {
  if (data === null || data === undefined) {
    return '';
  }
  if (language === 'plaintext') {
    return String(data);
  }
  return formatJsonBlock(data) === '—' ? '' : formatJsonBlock(data);
}

export default function RunPayloadJsonBlock({
  label,
  data,
  language = 'json',
  inlineMaxHeight = 240,
  emptyText = '—',
}: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const text = useMemo(() => toEditorValue(data, language), [data, language]);
  const isEmpty = !text.trim();

  const copyText = async () => {
    if (isEmpty) return;
    try {
      await navigator.clipboard.writeText(text);
      notification.success({ message: 'Copied to clipboard' });
    } catch {
      notification.error({ message: 'Copy failed' });
    }
  };

  const previewStyle: React.CSSProperties = {
    background: language === 'plaintext' ? '#fff1f0' : '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    overflow: 'auto',
    maxHeight: inlineMaxHeight,
    margin: 0,
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
          gap: 8,
        }}
      >
        <Text strong={language === 'plaintext'} type={language === 'plaintext' ? 'danger' : undefined}>
          {label}
        </Text>
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            disabled={isEmpty}
            onClick={() => void copyText()}
          >
            Copy
          </Button>
          <Button
            type="text"
            size="small"
            icon={<FullscreenOutlined />}
            disabled={isEmpty}
            onClick={() => setFullscreen(true)}
          >
            Fullscreen
          </Button>
        </Space>
      </div>

      {isEmpty ? (
        <Text type="secondary">{emptyText}</Text>
      ) : (
        <pre style={previewStyle}>{text}</pre>
      )}

      <Modal
        title={
          <Space>
            <span>{label}</span>
            <Button
              type="text"
              size="small"
              icon={<CompressOutlined />}
              onClick={() => setFullscreen(false)}
            >
              Exit fullscreen
            </Button>
          </Space>
        }
        open={fullscreen}
        onCancel={() => setFullscreen(false)}
        footer={
          <Space>
            <Button icon={<CopyOutlined />} onClick={() => void copyText()} disabled={isEmpty}>
              Copy
            </Button>
            <Button type="primary" onClick={() => setFullscreen(false)}>
              Close
            </Button>
          </Space>
        }
        width="100%"
        style={{ top: 0, maxWidth: '100vw', padding: 0 }}
        styles={{
          body: {
            flex: 1,
            padding: 0,
            overflow: 'hidden',
            minHeight: 0,
            height: 'calc(100vh - 108px)',
          },
        }}
        destroyOnHidden
      >
        <div style={{ height: 'calc(100vh - 108px)', minHeight: 320 }}>
        <Editor
          height="calc(100vh - 108px)"
          language={language}
          theme="vs-dark"
          value={text}
          options={{
            readOnly: true,
            minimap: { enabled: true },
            fontSize: 13,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            folding: true,
            lineNumbers: 'on',
          }}
        />
        </div>
      </Modal>
    </div>
  );
}
