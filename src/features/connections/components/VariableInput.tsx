'use client';

import React, { useRef, useState } from 'react';
import { useConnectionStore } from '@/store/useConnectionStore';
import { HighlightVariables } from './HighlightVariables';
import { KeyValuePair } from '@/types/restForm';

interface VariableInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  variables: KeyValuePair[];
}

export default function VariableInput({ 
  value, 
  onChange, 
  placeholder, 
  className = "" ,
  variables = []
}: VariableInputProps) {
  const [isFocused, setIsFocused] = useState(false);


  return (
    <div className={`relative w-full flex items-center min-h-9.5 cursor-text ${className}`}>
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isFocused ? placeholder : ""}
        className={`w-full h-full bg-transparent px-3 py-2 text-sm font-mono outline-none border-none transition-opacity duration-150 ${
          isFocused ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}