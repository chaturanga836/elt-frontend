'use client';

import React, { useState } from 'react';
import KeyValueTable from './KeyValueTable';
import { Lock, Code2, ListTree, Settings2 } from 'lucide-react';
import RestApiBody from './RestApiBody';
import RequestAuth from './Auth';
import { useConnectionStore } from '@/store/useConnectionStore'; // Import the store
import FetchSettings from './Settings';

const tabs = [
  { id: "Params", icon: <ListTree size={14} /> },
  { id: "Headers", icon: <Settings2 size={14} /> },
  { id: "Body", icon: <Code2 size={14} /> },
  { id: "Auth", icon: <Lock size={14} /> },
  { id: "Settings", icon: <Settings2 size={14} /> }
] as const;

type Tab = typeof tabs[number]["id"];

export default function RequestTab() {
  const [activeTab, setActiveTab] = useState<Tab>("Params");

  // 1. Hook into the store
  const { params, headers, updateTable, updateQueryParams, variables } = useConnectionStore();

  return (
    <div className="flex flex-col w-full h-full min-h-100">
      {/* TAB NAVIGATION */}
      <div className="flex border-b border-border bg-card/50 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all
              ${activeTab === tab.id 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-b-2 border-transparent"}
            `}
          >
            {tab.icon}
            {tab.id}
            
            {/* Logic: Show a pulse if there are headers present */}
            {tab.id === "Headers" && headers.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT AREA */}
      <div className="p-4 bg-card flex-1">
        {activeTab === "Params" && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Query Parameters</p>
            {/* 2. Connect Params to Store */}
            <KeyValueTable 
              initialPairs={params} 
              globalVariables={variables}
              onChange={(data) => updateQueryParams(data)}
              keyPlaceholder="parameter" 
              valuePlaceholder="value" 
            />
          </div>
        )}

        {activeTab === "Headers" && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Request Headers</p>
            {/* 3. Connect Headers to Store */}
            <KeyValueTable 
              initialPairs={headers} 
              globalVariables={variables}
              onChange={(data) => updateTable('headers', data)}
              keyPlaceholder="header" 
              valuePlaceholder="value" 
            />
          </div>
        )}

        {activeTab === "Body" && <RestApiBody />}

        {activeTab === "Auth" && <RequestAuth />}

          {activeTab === "Settings" && <FetchSettings />}
      </div>
    </div>
  );
}