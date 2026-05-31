'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { HighlightVariables } from './HighlightVariables';
import { KeyValuePair } from '@/types/restForm';
import { useDropdownStore } from '@/store/useDropdownStore';

interface VariableInputProps {
  value: string;
  onChange: (val: string) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  variables: KeyValuePair[];
}

export default function VariableInput({ 
  value, 
  onChange, 
  onPaste,
  placeholder, 
  className = "",
  variables = []
}: VariableInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { open, config, show, hide, updateFilter, selectedIndex, setSelectedIndex } = useDropdownStore();

  const isOwnDropdown = open && config?.onSelect !== undefined && inputRef.current === document.activeElement;

  const filteredItems = isOwnDropdown
    ? variables.filter((v) => v.key && v.enabled && v.key.toLowerCase().includes((config?.filter || '').toLowerCase()))
    : [];

  const getVariableInsertContext = useCallback(
    (inputValue: string, cursorPos: number) => {
      const before = inputValue.slice(0, cursorPos);
      const match = before.match(/\{\{([^}]*)$/);
      if (match) {
        return { active: true, filter: match[1], startPos: match.index! };
      }
      return { active: false, filter: '', startPos: -1 };
    },
    [],
  );

  const insertVariable = useCallback(
    (varKey: string) => {
      const input = inputRef.current;
      if (!input) return;

      const cursorPos = input.selectionStart || 0;
      const before = value.slice(0, cursorPos);
      const after = value.slice(cursorPos);

      const match = before.match(/\{\{([^}]*)$/);
      if (match) {
        const prefix = before.slice(0, match.index!);
        const newValue = `${prefix}{{${varKey}}}${after}`;
        onChange(newValue);

        const newCursorPos = prefix.length + varKey.length + 4;
        requestAnimationFrame(() => {
          input.setSelectionRange(newCursorPos, newCursorPos);
          input.focus();
        });
      }
    },
    [value, onChange],
  );

  const showDropdown = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    show({
      anchorRect: rect,
      items: variables,
      filter: '',
      onSelect: insertVariable,
    });
  }, [variables, insertVariable, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    onChange(newValue);

    const ctx = getVariableInsertContext(newValue, cursorPos);
    const hasEnabledVars = variables.some((v) => v.key && v.enabled);
    if (ctx.active && hasEnabledVars) {
      if (!open) {
        showDropdown();
      }
      updateFilter(ctx.filter);
    } else if (isOwnDropdown) {
      hide();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOwnDropdown || filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((selectedIndex + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((selectedIndex - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected?.key) {
        insertVariable(selected.key);
        hide();
      }
    } else if (e.key === 'Escape') {
      hide();
    }
  };

  useEffect(() => {
    if (!isFocused && isOwnDropdown) {
      hide();
    }
  }, [isFocused, isOwnDropdown, hide]);

  // Sync dropdown anchor on open; listen for scroll/resize only (not every render)
  useEffect(() => {
    if (!open || !isOwnDropdown) return;
    const el = containerRef.current;
    if (!el) return;

    const syncAnchor = () => {
      useDropdownStore.getState().updateAnchor(el.getBoundingClientRect());
    };

    syncAnchor();
    window.addEventListener('resize', syncAnchor);
    window.addEventListener('scroll', syncAnchor, true);
    return () => {
      window.removeEventListener('resize', syncAnchor);
      window.removeEventListener('scroll', syncAnchor, true);
    };
  }, [open, isOwnDropdown]);

  return (
    <div ref={containerRef} className={`relative w-full flex items-center min-h-9.5 cursor-text ${className}`}>
      {/* LAYER 1: The Highlight Renderer (Visible when NOT focused) */}
      <div 
        className={`absolute inset-0 px-3 py-2 pointer-events-none flex items-center overflow-hidden transition-opacity duration-150 ${
          isFocused ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {value ? (
          <HighlightVariables text={value} variables={variables} />
        ) : (
          <span className="text-muted-foreground/30 text-sm">{placeholder}</span>
        )}
      </div>

      {/* LAYER 2: The Actual Native Input (Visible/Opaque when focused) */}
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onPaste={onPaste}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setTimeout(() => setIsFocused(false), 200);
        }}
        placeholder={isFocused ? placeholder : ""}
        className={`w-full h-full bg-transparent px-3 py-2 text-sm font-mono outline-none border-none transition-opacity duration-150 ${
          isFocused ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
