'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { theme } from 'antd';

interface WorkflowNodeShellProps {
  title: string;
  color: string;
  children?: React.ReactNode;
  sourceHandles?: { id: string; label?: string; position?: Position }[];
  target?: boolean;
  source?: boolean;
}

export default function WorkflowNodeShell({
  title,
  color,
  children,
  sourceHandles,
  target = true,
  source = true,
}: WorkflowNodeShellProps) {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <div
      style={{
        minWidth: 220,
        borderRadius: 8,
        border: `2px solid ${color}`,
        background: colorBgContainer,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        fontSize: 12,
      }}
    >
      {target && (
        <Handle type="target" position={Position.Left} style={{ background: color }} />
      )}
      <div
        style={{
          padding: '6px 10px',
          background: color,
          color: '#fff',
          fontWeight: 600,
          borderRadius: '6px 6px 0 0',
        }}
      >
        {title}
      </div>
      <div style={{ padding: 10 }}>{children}</div>
      {source && !sourceHandles && (
        <Handle type="source" position={Position.Right} id="default" style={{ background: color }} />
      )}
      {sourceHandles?.map((h, i) => (
        <Handle
          key={h.id}
          type="source"
          position={h.position || Position.Right}
          id={h.id}
          style={{
            background: color,
            top: `${30 + i * 24}%`,
          }}
        />
      ))}
    </div>
  );
}
