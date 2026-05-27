'use client';

import { Select, Badge, Tooltip, message } from 'antd';
import React, { useMemo, useState } from 'react';
import { Send, Globe, Loader2 } from 'lucide-react';
import { useConnectionStore } from '@/store/useConnectionStore';
import { HttpMethod } from '@/types/restForm';
import VariableInput from './VariableInput';
import { connectionService } from '@/services/connection.service';
import { TestResponse } from './ResponsePanel';
import { buildUrlWithParams } from '@/lib/urlSync';

const methodColorMap: Record<HttpMethod, string> = {
  GET: "text-green-600",
  POST: "text-blue-600",
  PUT: "text-yellow-600",
  DELETE: "text-red-600",
  PATCH: "text-purple-600",
};
const methods: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];

interface UrlBarProps {
  onTestResult?: (result: TestResponse) => void;
}

export default function UrlBar({ onTestResult }: UrlBarProps = {}) {
  const store = useConnectionStore();
  const { url, params, method, setMethod, variables, groupId, setUrlFromBar } = store;

  const displayUrl = useMemo(() => buildUrlWithParams(url, params), [url, params]);

  const [testing, setTesting] = useState(false);

  const activeMethod = method as HttpMethod;
  const activeColor = methodColorMap[activeMethod] || "text-foreground";

  const handleTest = async () => {
    if (!displayUrl) return message.warning("Please enter a URL first");

    setTesting(true);
    try {
      const result = await connectionService.testConnection(store);
      onTestResult?.(result);

      if (result.success) {
        message.success(`Status: ${result.status_code} · ${result.response_time_ms}ms`);
      } else {
        message.error(`Failed: ${result.status_code}`);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      message.error(err.message || "Network error occurred");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex items-center w-full gap-0 border border-border rounded bg-card shadow-sm focus-within:ring-1 focus-within:ring-primary/20 transition-all">
      <Select
        value={activeMethod}
        onChange={setMethod}
        variant="borderless"
        className={`w-32 border-r border-border font-mono font-bold text-xs h-10 flex items-center ${activeColor}`}
        options={methods.map(m => ({ label: m, value: m }))}
      />

      <div className="relative flex-1 flex items-center">
        <div className="pl-3 text-muted-foreground/40">
          <Globe size={14} />
        </div>
        <div className="flex-1">
          <VariableInput
            value={displayUrl}
            onChange={setUrlFromBar}
            variables={variables}
            placeholder={groupId ? "https://api.example.com/v2/api?key=value" : "https://api.example.com/v1/resource"}
            className="w-full"
          />
        </div>

        {displayUrl.includes('{{') && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Tooltip title="Contains environment variables">
              <Badge dot status="processing" color="blue" />
            </Tooltip>
          </div>
        )}
      </div>

      <button
        disabled={testing}
        className={`h-10 px-6 bg-secondary border-l border-border text-xs font-semibold transition-colors flex items-center gap-2 
          ${testing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent hover:text-primary text-muted-foreground'}`}
        onClick={handleTest}
      >
        {testing ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Send size={12} className="text-primary" />
        )}
        <span>{testing ? 'Sending...' : 'Test'}</span>
      </button>
    </div>
  );
}
