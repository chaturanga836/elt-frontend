'use client';

import React from 'react';
import { Tag, Typography, Tooltip } from 'antd';
import { KeyValuePair } from '@/types/restForm';

const { Text } = Typography;

interface HighlightVariablesProps {
  text: string | number | null | undefined;
  variables: KeyValuePair[];
}

export const HighlightVariables = ({ text, variables }: HighlightVariablesProps) => {
  if (text === undefined || text === null) return null;

  const inputString = String(text);
  // Regex to capture the content inside {{ }}
  const parts = inputString.split(/{{(.*?)}}/g);

  return (
    <div className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 leading-6">
      {parts.map((part, index) => {
        // index % 2 === 1 means this is a captured variable name
        if (index % 2 === 1) {
          const variable = variables.find((v) => v.key === part && v.enabled);
          const found = !!variable;
          
          return (
            <Tooltip 
              key={index} 
              title={found ? `Resolved: ${variable.value}` : "Variable not defined or disabled"}
            >
              <Tag
                color={found ? 'success' : 'error'}
                className="mx-0 px-1.5 font-mono text-[11px] border-none flex items-center h-5"
                style={{ 
                  borderRadius: '4px',
                  // Using AntD success/error token opacities for a modern look
                  backgroundColor: found ? 'rgba(82, 196, 26, 0.15)' : 'rgba(255, 77, 79, 0.15)',
                  color: found ? '#52c41a' : '#ff4d4f'
                }}
              >
                {`{{${part}}}`}
              </Tag>
            </Tooltip>
          );
        }
        
        // Regular text
        return (
          <Text key={index} className="text-sm font-normal">
            {part}
          </Text>
        );
      })}
    </div>
  );
};