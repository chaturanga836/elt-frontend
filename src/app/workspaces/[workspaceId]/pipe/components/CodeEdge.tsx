'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { getBezierPath, EdgeProps, BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import { Modal, Input, Button, Typography, Space, Alert } from 'antd';
import { CodeOutlined, WarningOutlined } from '@ant-design/icons';
import { detectExternalUrls, UrlViolation } from '@/lib/validateExternalUrls';
import { ExternalLinkService } from '@/services/external-link.service';

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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [violations, setViolations] = useState<UrlViolation[]>([]);
  const [allowedUrls, setAllowedUrls] = useState<string[]>([]);
  const randomFuncName = `fn_${Math.random().toString(36).substring(7)}`;

  useEffect(() => {
    if (isModalOpen) {
      ExternalLinkService.list({ limit: 500 })
        .then((res) => setAllowedUrls(res.items.map((l) => l.url)))
        .catch(() => {});
    }
  }, [isModalOpen]);

  const validateCode = useCallback(
    (value: string) => {
      const found = detectExternalUrls(value, allowedUrls);
      setViolations(found);
      return found;
    },
    [allowedUrls],
  );

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCode(value);
    validateCode(value);
  };

  const handleOk = () => {
    const currentViolations = detectExternalUrls(code, allowedUrls);
    if (currentViolations.length > 0) return;
    setIsModalOpen(false);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
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
        onOk={handleOk}
        okButtonProps={{ disabled: violations.length > 0 }}
        width={500}
      >
        <Title level={5} style={{ marginTop: 0 }}>Function: {randomFuncName}</Title>
        <Text type="secondary">
          Define how data from Source transforms before Target.
          External URLs are not allowed — use registered connections.
        </Text>

        {violations.length > 0 && (
          <Alert
            type="error"
            showIcon
            icon={<WarningOutlined />}
            message={`${violations.length} unauthorized URL(s) detected`}
            description={
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                {violations.map((v, i) => (
                  <li key={i}>Line {v.line}: <code>{v.url}</code></li>
                ))}
              </ul>
            }
            style={{ marginTop: 8, marginBottom: 8 }}
          />
        )}

        <TextArea
          rows={6}
          placeholder={`function ${randomFuncName}(params) {\n  // Your logic here (no external URLs)\n  return params;\n}`}
          style={{ marginTop: 12, fontFamily: 'monospace' }}
          value={code || `async function ${randomFuncName}(params) {\n  const result = params;\n  return result;\n}`}
          onChange={handleCodeChange}
          status={violations.length > 0 ? 'error' : undefined}
        />
      </Modal>
    </>
  );
}