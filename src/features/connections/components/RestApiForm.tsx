'use client';

import React, { useState } from 'react';
import { Variable, Zap } from 'lucide-react';
import UrlBar from './UrlBar';
import RequestTab from './RequestTab';
import { VariablesDrawer } from './VariablesDrawer';
import { KeyValuePair } from '@/types/restForm';



const defaultPair = (): KeyValuePair => ({ uiId: crypto.randomUUID(), id: null, key: "", value: "", enabled: true });

export default function RestApiForm() {

 const [drawerOpen, setDrawerOpen] = useState(false);
  const [variables, setVariables] = useState<KeyValuePair[]>([defaultPair()]);
  return (
    <React.Fragment>
      <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b border-border bg-card px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-primary" />
          <span className="font-semibold text-foreground text-sm">API Client</span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary bg-secondary hover:bg-accent rounded border border-border transition-colors"
        >
          <Variable size={14} />
          Variables
          {variables.filter(v => v.key).length > 0 && (
            <span className="ml-1 w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
              {variables.filter(v => v.key).length}
            </span>
          )}
        </button>
      </header>


      <main className="flex-1 p-4 mx-auto w-full space-y-4">
        <UrlBar />
        <RequestTab />
      </main>
      </div>


            <VariablesDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variables={variables}
        onVariablesChange={setVariables}
      />
    </React.Fragment>
  
  );
}