'use client';

import React, { useState } from 'react';
import { Tag, Tabs, Typography, Tooltip } from 'antd';
import { Copy, Check, Clock, Database } from 'lucide-react';

const { Text } = Typography;

export interface TestResponse {
  success: boolean;
  status_code: number;
  response_time_ms: number;
  response_format: 'json' | 'xml' | 'text';
  content_type: string;
  data: any;
  curl: string;
  response_headers: Record<string, string>;
  response_size: number;
}

interface ResponsePanelProps {
  response: TestResponse | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy'}>
      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </Tooltip>
  );
}

function StatusBadge({ code }: { code: number }) {
  const color = code >= 200 && code < 300 ? 'green' : code >= 400 ? 'red' : 'orange';
  return <Tag color={color} className="font-mono text-xs">{code}</Tag>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatData(data: any, format: string): string {
  if (format === 'json') {
    return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  }
  return String(data);
}

export default function ResponsePanel({ response }: ResponsePanelProps) {
  if (!response) return null;

  const statusCode = Number(response.status_code) || 0;
  const responseTimeMs = Number(response.response_time_ms) || 0;
  const responseFormat = response.response_format || 'text';
  const responseHeaders = response.response_headers ?? {};
  const curlCommand = typeof response.curl === 'string' ? response.curl : '';
  const responseSize = Number(response.response_size) || 0;

  const formattedBody = formatData(response.data, responseFormat);

  const tabItems = [
    {
      key: 'body',
      label: (
        <span className="text-xs font-medium">Body</span>
      ),
      children: (
        <div className="relative">
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
            <Tag className="text-[10px]">{responseFormat.toUpperCase()}</Tag>
            <CopyButton text={formattedBody} />
          </div>
          <pre className="bg-[#1e1e1e] text-[#d4d4d4] rounded-lg p-4 text-xs font-mono overflow-auto max-h-80 leading-5">
            {responseFormat === 'json' ? (
              <JsonHighlight json={formattedBody} />
            ) : (
              formattedBody
            )}
          </pre>
        </div>
      ),
    },
    {
      key: 'curl',
      label: (
        <span className="text-xs font-medium">cURL</span>
      ),
      children: (
        <div className="relative">
          <div className="absolute top-2 right-2 z-10">
            <CopyButton text={curlCommand} />
          </div>
          <pre className="bg-[#1e1e1e] text-[#d4d4d4] rounded-lg p-4 text-xs font-mono overflow-auto max-h-60 leading-5 whitespace-pre-wrap">
            {curlCommand}
          </pre>
        </div>
      ),
    },
    {
      key: 'headers',
      label: (
        <span className="text-xs font-medium">Headers</span>
      ),
      children: (
        <div className="bg-[#1e1e1e] rounded-lg p-4 overflow-auto max-h-60">
          {Object.entries(responseHeaders).map(([key, value]) => (
            <div key={key} className="flex gap-3 py-1 border-b border-white/5 last:border-0">
              <span className="text-[#569cd6] text-xs font-mono font-medium min-w-[160px]">{key}</span>
              <span className="text-[#ce9178] text-xs font-mono break-all">{value}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Response</Text>
          <StatusBadge code={statusCode} />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock size={12} />
            <span className="text-[11px] font-mono">{responseTimeMs} ms</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Database size={12} />
            <span className="text-[11px] font-mono">{formatBytes(responseSize)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-2">
        <Tabs
          defaultActiveKey="body"
          size="small"
          items={tabItems}
          className="response-tabs"
        />
      </div>
    </div>
  );
}

function JsonHighlight({ json }: { json: string }) {
  const highlighted = json
    .replace(/"([^"]+)":/g, '<span style="color:#9cdcfe">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span style="color:#ce9178">"$1"</span>')
    .replace(/: (\d+)/g, ': <span style="color:#b5cea8">$1</span>')
    .replace(/: (true|false|null)/g, ': <span style="color:#569cd6">$1</span>');

  return <code dangerouslySetInnerHTML={{ __html: highlighted }} />;
}
