'use client';

import { Input, Select, Badge, Tooltip } from 'antd';
import React, { useState } from 'react';
import { Send, Globe } from 'lucide-react';
import { useConnectionStore } from '@/store/useConnectionStore';
import { HttpMethod } from '@/types/restForm';

const methodColorMap: Record<HttpMethod, string> = {
  GET: "text-green-600",
  POST: "text-blue-600",
  PUT: "text-yellow-600",
  DELETE: "text-red-600",
  PATCH: "text-purple-600",
};
const methods: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];

export default function UrlBar() {
  // const [method, setMethod] = useState<HttpMethod>("GET");
  // const [url, setUrl] = useState("");
  const { url, method, setUrl, setMethod } = useConnectionStore();
  
  const activeMethod = method as HttpMethod;
  const activeColor = methodColorMap[activeMethod] || "text-foreground";
  return (
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
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/v1/resource"
          variant="borderless"
          className="w-full bg-transparent px-2 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/30 outline-none"
        />
        
        {/* VARIABLE DETECTOR (Visual Hint) */}
        {url.includes('{{') && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Tooltip title="Contains environment variables">
               <Badge dot status="processing" color="blue" />
            </Tooltip>
          </div>
        )}
      </div>

      {/* TEST/SEND BUTTON (Optional, but useful for testing connections) */}
      {/* <button 
        className="h-10 px-4 bg-secondary border-l border-border text-xs font-semibold hover:bg-accent transition-colors flex items-center gap-2"
        onClick={() => console.log("Test Connection", method, url)}
      >
        <Send size={12} className="text-primary" />
        <span>Test</span>
      </button> */}
    </div>
  );
}