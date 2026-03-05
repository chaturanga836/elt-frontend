'use client';

import React, { useEffect, useState } from 'react';
import KeyValueTable from './KeyValueTable';
import { useConnectionStore } from '@/store/useConnectionStore';
import { IFormData, IGraphQL, IRawBody, BodyType } from '@/types/connection';

// 1. Array must match your exported BodyType exactly
const bodyTypes: BodyType[] = ["none", "form-data", "json", "xml", "graphQL"];

export default function ResApiBody() {
  const [mounted, setMounted] = useState(false);
  
  const type = useConnectionStore((state) => state.body.activeType);
  const bodyData = useConnectionStore((state) => state.body.bodyData);
  const setBodyType = useConnectionStore((state) => state.setBodyType);
  const updateBodyData = useConnectionStore((state) => state.updateBodyContent);
  const variables = useConnectionStore((state) => state.variables);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const renderContent = () => {
    switch (type) {
      case "none":
        return (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50 border border-dashed border-border rounded">
            <span className="text-xs">This request does not have a body</span>
          </div>
        );
      
      case "form-data": {
        const data = bodyData as IFormData;
        return (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Multipart Form Data</p>
            <KeyValueTable 
              initialPairs={data?.pairs || []} 
              onChange={(newPairs) => updateBodyData({ pairs: newPairs })}
              keyPlaceholder="Key" 
              valuePlaceholder="Value" 
              globalVariables={variables}
            />
          </div>
        );
      }

      case "json":
      case "xml": {
        const data = bodyData as IRawBody;
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground font-medium uppercase">{type} Editor</span>
              <button className="text-[10px] text-primary hover:underline font-medium">
                Beautify
              </button>
            </div>
            <textarea
              suppressHydrationWarning
              value={data?.content || ""}
              onChange={(e) => updateBodyData({ content: e.target.value })}
              placeholder={type === "json" ? '{"key": "value"}' : `<root></root>`}
              rows={12}
              className="w-full bg-muted/30 border border-border rounded p-4 text-[13px] font-mono text-foreground placeholder:text-muted-foreground/20 outline-none resize-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        );
      }

      case "graphQL": {
        const data = bodyData as IGraphQL;
        return (
          <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-bottom-2">
             <div className="space-y-2">
                <span className="text-[11px] text-muted-foreground font-medium uppercase">Query</span>
                <textarea
                  value={data?.query || ""}
                  onChange={(e) => updateBodyData({ query: e.target.value })}
                  placeholder="query { ... }"
                  rows={8}
                  className="w-full bg-muted/30 border border-border rounded p-4 text-[13px] font-mono outline-none"
                />
             </div>
             <div className="space-y-2">
                <span className="text-[11px] text-muted-foreground font-medium uppercase">Variables (JSON)</span>
                <textarea
                  value={data?.variables || ""}
                  onChange={(e) => updateBodyData({ variables: e.target.value })}
                  placeholder="{}"
                  rows={4}
                  className="w-full bg-muted/30 border border-border rounded p-4 text-[13px] font-mono outline-none"
                />
             </div>
          </div>
        );
      }
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 px-1">
        {bodyTypes.map((t) => (
          <label key={t} className="flex items-center gap-1.5 cursor-pointer group">
            <input
              type="radio"
              name="bodyType"
              checked={type === t}
              onChange={() => setBodyType(t)} // No casting needed now
              suppressHydrationWarning
              className="w-3 h-3 accent-primary"
            />
            <span className={`text-[11px] font-medium transition-colors ${type === t ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
              {t}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-2">
        {renderContent()}
      </div>
    </div>
  );
}