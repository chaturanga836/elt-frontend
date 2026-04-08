'use client';

import React, { useState } from 'react';
import { Edit2, Loader2, Save, Variable, Zap } from 'lucide-react';
import UrlBar from './UrlBar';
import RequestTab from './RequestTab';
import { VariablesDrawer } from './VariablesDrawer';
import { useConnectionStore } from '@/store/useConnectionStore';
import { Button, Input, message } from 'antd';
import { useApiStore } from '@/store/useApiStore';

export default function RestApiForm() {

  const [drawerOpen, setDrawerOpen] = useState(false);
  const variables = useConnectionStore((state) => state.variables);
  const updateVariables = useConnectionStore((state) => state.updateVariables);
  const { isSaving, saveCurrentConnection } = useApiStore();
  const connectionId = useConnectionStore((state) => state.id);
  const connectionName = useConnectionStore((state) => state.connectionName);
  const setConnection = useConnectionStore((state) => state.setConnection);
  const description = useConnectionStore((state) => state.description);
  
  const handleSave = async () => {
    try {
      // For now, using a placeholder tenant_id
      await saveCurrentConnection("trial_user_001");
      message.success(connectionId ? "Connection updated" : "Connection saved to Postgres");
    } catch (error: any) {
      message.error(error.message || "Failed to save connection");
    }
  };
  return (
    <React.Fragment>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-primary" />
            <span className="font-semibold text-foreground text-sm">API Client</span>
          </div>

          <div className="flex items-center gap-2 max-w-md w-full group">
              <Input
                variant="borderless"
                placeholder="Untitled Connection"
                value={connectionName || ""}
                onChange={(e) => setConnection(e.target.value, description || "")}
                className="font-semibold text-sm px-1 hover:bg-secondary/50 focus:bg-secondary/50 transition-colors placeholder:text-muted-foreground/50"
              />
              <Edit2 size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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

                <Button
              type="primary"
              size="small"
              icon={isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center gap-1.5 h-7.5 text-xs font-medium shadow-none"
            >
              {isSaving ? 'Saving...' : 'Save Connection'}
            </Button>
        </main>
      </div>

      <VariablesDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variables={variables}
        onVariablesChange={updateVariables}
      />

    </React.Fragment>

  );
}