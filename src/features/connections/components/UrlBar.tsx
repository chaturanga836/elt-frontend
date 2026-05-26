'use client';

import { Select, Badge, Tooltip, message } from 'antd';
import React, { useState, useCallback } from 'react';
import { Send, Globe, Loader2 } from 'lucide-react';
import { useConnectionStore } from '@/store/useConnectionStore';
import { HttpMethod, KeyValuePair } from '@/types/restForm';
import VariableInput from './VariableInput';
import { connectionService } from '@/services/connection.service';
import { TestResponse } from './ResponsePanel';
import { generateId } from '@/lib/generateId';

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
  const { url, path, method, setUrl, setPath, setMethod, variables, groupId, groupBaseUrl, updateQueryParams, params, groupAuthType, groupAuthConfig } = store;
  const displayUrl = groupId ? path || url : url;

  const fullResolvedUrl = React.useMemo(() => {
    const base = groupId && groupBaseUrl ? groupBaseUrl : '';
    const pathPart = displayUrl || '';
    const activeParams = params.filter(p => p.key && p.enabled);

    const allEntries: { key: string; value: string }[] = activeParams.map(p => ({ key: p.key!, value: p.value || '' }));

    if (groupId && groupAuthType === 4 && groupAuthConfig?.addTo === 'query' && groupAuthConfig?.key) {
      allEntries.push({ key: groupAuthConfig.key, value: groupAuthConfig.value || '' });
    }

    const urlBase = base + pathPart;
    if (allEntries.length === 0) return urlBase || '';
    const qs = allEntries.map(e => `${encodeURIComponent(e.key)}=${encodeURIComponent(e.value)}`).join('&');
    return `${urlBase}?${qs}`;
  }, [displayUrl, params, groupId, groupBaseUrl, groupAuthType, groupAuthConfig]);

  const handleUrlChange = useCallback((rawValue: string) => {
    const value = rawValue.replace(/'+$/, ''); // strip trailing quotes from pastes
    const qIndex = value.indexOf('?');

    if (qIndex === -1) {
      if (groupId) setPath(value); else setUrl(value);
      return;
    }

    const pathPart = value.slice(0, qIndex);
    const queryString = value.slice(qIndex + 1);

    if (groupId) setPath(pathPart); else setUrl(pathPart);

    const searchParams = new URLSearchParams(queryString);
    const existingKeys = new Set(params.filter(p => p.key).map(p => p.key));
    const newParams: KeyValuePair[] = [...params];

    searchParams.forEach((val, key) => {
      if (!existingKeys.has(key)) {
        newParams.push({
          uiId: generateId(),
          id: null,
          key,
          value: val,
          enabled: true,
        });
      } else {
        const idx = newParams.findIndex(p => p.key === key);
        if (idx !== -1) {
          newParams[idx] = { ...newParams[idx], value: val };
        }
      }
    });

    updateQueryParams(newParams);
  }, [groupId, setPath, setUrl, params, updateQueryParams]);
  const [testing, setTesting] = useState(false);

  const activeMethod = method as HttpMethod;
  const activeColor = methodColorMap[activeMethod] || "text-foreground";

  const handleTest = async () => {
    if (!groupId && !displayUrl) return message.warning("Please enter a URL first");
    
    setTesting(true);
    try {
      const result = await connectionService.testConnection(store);
      onTestResult?.(result);

      if (result.success) {
        message.success(`Status: ${result.status_code} · ${result.response_time_ms}ms`);
      } else {
        message.error(`Failed: ${result.status_code}`);
      }
    } catch (error: any) {
      message.error(error.message || "Network error occurred");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center w-full gap-0 border border-border rounded bg-card shadow-sm focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        {/* METHOD SELECTOR */}
        <Select
          value={activeMethod}
          onChange={setMethod}
          variant="borderless"
          className={`w-32 border-r border-border font-mono font-bold text-xs h-10 flex items-center ${activeColor}`}
          options={methods.map(m => ({ label: m, value: m }))}
        />

        {/* URL INPUT */}
        <div className="relative flex-1 flex items-center">
          <div className="pl-3 text-muted-foreground/40">
            <Globe size={14} />
          </div>
          {groupId && groupBaseUrl && (
            <Tooltip title="Base URL inherited from group (read-only)">
              <div className="flex items-center pl-2 pr-0 shrink-0 border-r border-border">
                <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded select-none whitespace-nowrap">
                  {groupBaseUrl}
                </span>
              </div>
            </Tooltip>
          )}
          <div className="flex-1">
            <VariableInput
              value={displayUrl}
              onChange={handleUrlChange}
              variables={variables}
              placeholder={groupId ? "/path (optional — leave empty if params-only)" : "https://api.example.com/v1/resource"}
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

        {/* TEST BUTTON */}
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

      {/* Full resolved URL preview */}
      {fullResolvedUrl && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded border border-border/50">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase shrink-0">Full URL</span>
          <span className="text-[11px] font-mono text-muted-foreground truncate select-all">
            {fullResolvedUrl}
          </span>
        </div>
      )}
    </div>
  );
}