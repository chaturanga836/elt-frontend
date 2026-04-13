'use client';
import React, { useState } from 'react';
import { getBezierPath, EdgeProps, BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import { Modal, Input, Button, Typography, Space } from 'antd';
import { CodeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CodeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  // 1. Calculate the path and the midpoint
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const randomFuncName = `fn_${Math.random().toString(36).substring(7)}`;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all', // Crucial: allows clicking the button
          }}
        >
          <Button
            size="small"
            shape="circle"
            type="primary"
            icon={<CodeOutlined style={{ fontSize: '12px' }} />}
            onClick={() => setIsModalOpen(true)}
            style={{ border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
          />
        </div>
      </EdgeLabelRenderer>

      <Modal
        title={<Space><CodeOutlined /> <Text strong>Custom Logic</Text></Space>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => setIsModalOpen(false)}
        width={500}
      >
        <Title level={5} style={{ marginTop: 0 }}>Function: {randomFuncName}</Title>
        <Text type="secondary">Define how data from Source transforms before Target.</Text>
        <TextArea
          rows={6}
          placeholder={`function ${randomFuncName}(params) {\n  // Your logic here\n  return params;\n}`}
          style={{ marginTop: 12, fontFamily: 'monospace' }}
          defaultValue={`async function ${randomFuncName}(params) {\n  const result = params;\n  return result;\n}`}
        />
      </Modal>
    </>
  );
}