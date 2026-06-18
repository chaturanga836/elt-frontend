'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Divider, Empty, Flex, Input, Spin, Typography, theme } from 'antd';
import { CheckCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { connectionService } from '@/services/connection.service';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';
import type { PipelineRestConnectionSummary } from '@/lib/pipelineConnectionPick';

const { Text } = Typography;

export interface RestConnectionPickerPanelProps {
  selectedId?: number | null;
  onSelect: (connection: PipelineRestConnectionSummary) => void;
  pipelineNodeId?: string;
  pipelineReturnUrl?: string;
  /** Close parent modal before navigating to create flow. */
  onNavigateAway?: () => void;
}

export default function RestConnectionPickerPanel({
  selectedId,
  onSelect,
  pipelineNodeId,
  pipelineReturnUrl,
  onNavigateAway,
}: RestConnectionPickerPanelProps) {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const {
    token: { colorBgContainer, colorInfo, colorBorder },
  } = theme.useToken();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PipelineRestConnectionSummary[]>([]);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await connectionService.getConnections(workspaceId);
      setItems(Array.isArray(res) ? res : []);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const haystack = [c.name, c.group_name, c.effective_url, c.url]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q) || String(c.id).includes(q);
    });
  }, [items, searchQuery]);

  const openCreateFlow = () => {
    onNavigateAway?.();
    const params = new URLSearchParams({ from: 'pipeline' });
    if (pipelineNodeId) params.set('nodeId', pipelineNodeId);
    if (pipelineReturnUrl) params.set('returnUrl', pipelineReturnUrl);
    router.push(
      `${workspacePath(workspaceId, 'connections/rest-api')}?${params.toString()}`,
    );
  };

  return (
    <Flex vertical gap={12}>
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search connections by name, group, or URL…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        allowClear
      />

      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={openCreateFlow}
        style={{ height: 40 }}
      >
        Create standalone REST connection
      </Button>

      <Divider style={{ margin: '4px 0' }} />

      <div style={{ minHeight: 160, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
        {loading ? (
          <Flex justify="center" style={{ padding: 24 }}>
            <Spin />
          </Flex>
        ) : filtered.length > 0 ? (
          filtered.map((connection) => (
            <div
              key={connection.id}
              onClick={() => onSelect(connection)}
              style={{
                padding: 12,
                marginBottom: 8,
                borderRadius: 8,
                border:
                  selectedId === connection.id ? `1px solid ${colorInfo}` : `1px solid ${colorBorder}`,
                cursor: 'pointer',
                background:
                  selectedId === connection.id
                    ? 'rgba(0, 212, 255, 0.12)'
                    : colorBgContainer,
              }}
            >
              <Flex align="center" justify="space-between" gap={8}>
                <Flex vertical style={{ minWidth: 0 }}>
                  <Text strong style={{ fontSize: 13 }}>
                    {connection.name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
                    ID {connection.id}
                    {connection.group_name ? ` · ${connection.group_name}` : ''}
                    {connection.effective_url || connection.url
                      ? ` · ${connection.effective_url || connection.url}`
                      : ''}
                  </Text>
                </Flex>
                {selectedId === connection.id ? (
                  <CheckCircleFilled style={{ color: '#13c2c2', fontSize: 16, flexShrink: 0 }} />
                ) : null}
              </Flex>
            </div>
          ))
        ) : (
          <Empty
            description={
              searchQuery.trim()
                ? 'No connections match your search'
                : 'No REST connections yet — create one above'
            }
          />
        )}
      </div>
    </Flex>
  );
}
