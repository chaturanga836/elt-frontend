'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Modal,
  Input,
  Typography,
  Flex,
  Empty,
  Spin,
  Button,
  Divider,
  Pagination,
} from 'antd';
import { SearchOutlined, PlusOutlined, CheckCircleFilled, EditOutlined } from '@ant-design/icons';
import { TaskService, TaskResponse } from '@/services/task.service';
import { useDebouncedFetch } from '@/features/connections/hooks/useDebouncedFetch';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';

const { Text } = Typography;
const PAGE_SIZE = 10;

export interface TaskPickerModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSelect: (task: TaskResponse) => void;
  selectedId?: number | string | null;
  showCreateButton?: boolean;
  /** When set, "Create" returns to this pipeline node after save. */
  pipelineNodeId?: string;
  pipelineReturnUrl?: string;
}

/**
 * Searchable, paginated task picker — use instead of inline Select for task lists.
 */
export default function TaskPickerModal({
  title,
  open,
  onClose,
  onSelect,
  selectedId,
  showCreateButton = true,
  pipelineNodeId,
  pipelineReturnUrl,
}: TaskPickerModalProps) {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data: taskResponse, searching, performFetch } = useDebouncedFetch(
    TaskService.getTaskList,
    300,
  );

  const loadPage = useCallback(
    (nextPage: number, query: string) => {
      performFetch({
        query,
        page: nextPage,
        limit: PAGE_SIZE,
        sort_by: 'updated_at',
        sort_order: 'desc',
      });
    },
    [performFetch],
  );

  useEffect(() => {
    if (open) {
      setPage(1);
      setSearchQuery('');
      loadPage(1, '');
    }
  }, [open, loadPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setPage(1);
    loadPage(1, val);
  };

  const handlePageChange = (next: number) => {
    setPage(next);
    loadPage(next, searchQuery);
  };

  const tasks = taskResponse?.items || [];
  const total = taskResponse?.total ?? 0;

  return (
    <Modal title={title} open={open} onCancel={onClose} footer={null} centered width={440}>
      <Flex vertical gap={12}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search tasks by name or id…"
          value={searchQuery}
          onChange={handleSearch}
          allowClear
        />

        {selectedId ? (
          <Button
            type="primary"
            block
            icon={<EditOutlined />}
            onClick={() => {
              onClose();
              const params = new URLSearchParams();
              if (pipelineNodeId) {
                params.set('from', 'pipeline');
                params.set('nodeId', pipelineNodeId);
                if (pipelineReturnUrl) {
                  params.set('returnUrl', pipelineReturnUrl);
                }
              }
              const qs = params.toString();
              router.push(
                `${workspacePath(workspaceId, `task/${selectedId}`)}${qs ? `?${qs}` : ''}`,
              );
            }}
            style={{ height: 40 }}
          >
            Edit assigned script
          </Button>
        ) : null}

        {showCreateButton && (
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => {
              onClose();
              const params = new URLSearchParams();
              if (pipelineNodeId) {
                params.set('from', 'pipeline');
                params.set('nodeId', pipelineNodeId);
                if (pipelineReturnUrl) {
                  params.set('returnUrl', pipelineReturnUrl);
                }
              }
              const qs = params.toString();
              router.push(
                `${workspacePath(workspaceId, 'task/new')}${qs ? `?${qs}` : ''}`,
              );
            }}
            style={{ height: 40 }}
          >
            Create new script
          </Button>
        )}

        <Divider style={{ margin: '4px 0' }} />

        <div style={{ minHeight: 200, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
          {searching ? (
            <Flex justify="center" style={{ padding: 24 }}>
              <Spin />
            </Flex>
          ) : tasks.length > 0 ? (
            tasks.map((task: TaskResponse) => (
              <div
                key={task.id}
                onClick={() => onSelect(task)}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  borderRadius: 8,
                  border:
                    selectedId === task.id ? '1px solid #1890ff' : '1px solid #f0f0f0',
                  cursor: 'pointer',
                  background: selectedId === task.id ? '#e6f7ff' : '#fff',
                }}
              >
                <Flex align="center" justify="space-between">
                  <Flex vertical>
                    <Text strong style={{ fontSize: 13 }}>
                      {task.name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      ID {task.id}
                      {task.description ? ` · ${task.description}` : ''}
                    </Text>
                  </Flex>
                  {selectedId === task.id && (
                    <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
                  )}
                </Flex>
              </div>
            ))
          ) : (
            <Empty description="No tasks found" />
          )}
        </div>

        {total > PAGE_SIZE && (
          <Pagination
            size="small"
            current={page}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={handlePageChange}
            showSizeChanger={false}
            style={{ textAlign: 'center' }}
          />
        )}
      </Flex>
    </Modal>
  );
}
