'use client';

import React, { useState, useEffect } from 'react';
import { KeyValuePair } from '@/types/restForm';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Checkbox, CheckboxProps, Input } from 'antd';

interface KeyValueTableProps {
  initialPairs?: KeyValuePair[];
  onChange?: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

const createEmptyPair = (): KeyValuePair => ({
   uiId: crypto.randomUUID(),
  id: null,
  key: null,
  value: null,
  enabled: true
});

export default function KeyValueTable({
  initialPairs = [],
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value"
}: KeyValueTableProps) {

  // Ensure we always have at least one empty row to start with
  const [pairs, setPairs] = useState<KeyValuePair[]>(
    initialPairs.length > 0 ? initialPairs : [createEmptyPair()]
  );

  // Sync internal state with parent
  const triggerChange = (updatedPairs: KeyValuePair[]) => {
    setPairs(updatedPairs);
    if (onChange) onChange(updatedPairs);
  };

  const updateRow = (id: string | null, field: keyof KeyValuePair, val: string | boolean) => {
    const newPairs = pairs.map(p => {
      if (p.uiId === id) {
        const updated = { ...p, [field]: val };
        return updated;
      }
      return p;
    });

    // Postman Logic: If user types in the last row, automatically add a new empty row
    const lastRow = newPairs[newPairs.length - 1];
    if (field !== 'enabled' && (lastRow.key || lastRow.value)) {
      newPairs.push(createEmptyPair());
    }

    triggerChange(newPairs);
  };

  const removeRow = (uiId: string) => {
    // Keep at least one empty row
    if (pairs.length === 1) {
      triggerChange([createEmptyPair()]);
      return;
    }
    triggerChange(pairs.filter(p => p.uiId !== uiId));
  };

  const addRow = () => {
    triggerChange([...pairs, createEmptyPair()]);
  };

return (
    <div className="border border-border rounded-md overflow-hidden bg-card shadow-sm">
      {/* 1. HEADER - Slimmer and more muted */}
      <div className="grid grid-cols-[38px_1fr_1fr_38px] bg-secondary/30 text-[10px] font-bold uppercase tracking-tight text-muted-foreground border-b border-border">
        <div className="p-2 text-center"></div>
        <div className="p-2 border-l border-border/50">Key</div>
        <div className="p-2 border-l border-border/50">Value</div>
        <div className="p-2 border-l border-border/50"></div>
      </div>

      {/* 2. ROWS - No internal borders on inputs */}
      <div className="divide-y divide-border/50">
        {pairs.map((pair, index) => (
          <div key={pair.uiId} className="grid grid-cols-[38px_1fr_1fr_38px] group hover:bg-primary/[0.02] items-center transition-colors">
            
            {/* Checkbox Cell */}
            <div className="flex items-center justify-center h-full">
              <Checkbox
                checked={!!pair.enabled}
                onChange={(e) => updateRow(pair.uiId, "enabled", e.target.checked)}
                className="scale-90"
              />
            </div>

            {/* Key Input - Variant="borderless" is the secret */}
            <div className="border-l border-border/50 h-full">
              <Input
                variant="borderless"
                value={pair.key ?? ""}
                onChange={(e) => updateRow(pair.uiId, "key", e.target.value)}
                placeholder={keyPlaceholder}
                className="h-full w-full font-mono text-xs px-3 py-2 focus:bg-background"
              />
            </div>

            {/* Value Input */}
            <div className="border-l border-border/50 h-full">
              <Input
                variant="borderless"
                value={pair.value ?? ""}
                onChange={(e) => updateRow(pair.uiId, "value", e.target.value)}
                placeholder={valuePlaceholder}
                className="h-full w-full font-mono text-xs px-3 py-2 focus:bg-background"
              />
            </div>

            {/* Delete Button - Transparent until hover */}
            <div className="border-l border-border/50 flex items-center justify-center h-full">
              <Button
                type="text"
                danger
                size="small"
                onClick={() => removeRow(pair.uiId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0 h-7 w-7 flex items-center justify-center"
                icon={<Trash2 size={13} />}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 3. ADD BUTTON - Integrated into the bottom of the table */}
      <Button
        color="primary"
        variant="solid"
        onClick={addRow}
        className="w-full py-2 flex items-center justify-center gap-2 text-[11px] font-medium text-muted-foreground hover:text-primary hover:bg-secondary/40 transition-all border-t border-border/50 bg-secondary/10"
      >
        <Plus size={14} /> Add Parameter
      </Button>
    </div>
  );
}