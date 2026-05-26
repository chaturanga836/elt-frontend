'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDropdownStore } from '@/store/useDropdownStore';

export default function VariableDropdownPortal() {
  const { open, config, selectedIndex, hide, setSelectedIndex } = useDropdownStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredItems = config?.items.filter(
    (v) =>
      v.key &&
      v.enabled &&
      v.key.toLowerCase().includes((config.filter || '').toLowerCase()),
  ) || [];

  const handleSelect = useCallback(
    (varKey: string) => {
      config?.onSelect(varKey);
      hide();
    },
    [config, hide],
  );

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        hide();
      }
    };

    const handleScroll = () => {
      hide();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, hide]);

  useEffect(() => {
    if (open && dropdownRef.current) {
      const activeItem = dropdownRef.current.querySelector('[data-active="true"]');
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, open]);

  if (!open || !config || filteredItems.length === 0) return null;

  const { anchorRect } = config;
  const top = anchorRect.bottom + 4;
  const left = anchorRect.left;

  const dropdown = (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 9999,
        width: 280,
      }}
      className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
    >
      <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50/80">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Variables
        </span>
      </div>
      <div className="max-h-52 overflow-y-auto py-1">
        {filteredItems.map((v, idx) => (
          <div
            key={v.uiId}
            data-active={idx === selectedIndex}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSelect(v.key!);
            }}
            onMouseEnter={() => setSelectedIndex(idx)}
            className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
              idx === selectedIndex
                ? 'bg-blue-50 text-blue-700'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span className="text-xs font-mono font-medium">
              {`{{${v.key}}}`}
            </span>
            {v.value && (
              <span className="text-[11px] text-gray-400 truncate max-w-[120px] ml-2">
                {v.value}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/50">
        <span className="text-[10px] text-gray-400">
          ↑↓ navigate · Enter/Tab select · Esc dismiss
        </span>
      </div>
    </div>
  );

  return createPortal(dropdown, document.body);
}
