'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Empty, List, Modal, Spin, Tag, Typography } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { PipelineService } from '@/services/pipe.service';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

const { Text } = Typography;

export type PipelinePickerItem = {
  pipeline_uuid: string;
  name: string;
  is_draft?: boolean;
};

export interface PipelinePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (pipeline: PipelinePickerItem) => void;
  selectedUuid?: string | null;
}

export default function PipelinePickerModal({
  open,
  onClose,
  onSelect,
  selectedUuid,
}: PipelinePickerModalProps) {
  const workspaceId = useWorkspaceId();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PipelinePickerItem[]>([]);

  const loadPipelines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PipelineService.getPipelines({
        workspace_id: workspaceId,
        page: 1,
        size: 100,
      });
      setItems(
        (res.items || []).map((p: PipelinePickerItem) => ({
          pipeline_uuid: p.pipeline_uuid,
          name: p.name || 'Untitled pipeline',
          is_draft: p.is_draft,
        })),
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (open) {
      void loadPipelines();
    }
  }, [open, loadPipelines]);

  return (
    <Modal
      title="Select pipeline"
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      ) : items.length === 0 ? (
        <Empty description="No pipelines in this workspace. Create and publish one first." />
      ) : (
        <List
          dataSource={items}
          renderItem={(item) => {
            const isSelected = item.pipeline_uuid === selectedUuid;
            const isDraft = Boolean(item.is_draft);
            return (
              <List.Item
                actions={[
                  <Button
                    key="pick"
                    type={isSelected ? 'default' : 'primary'}
                    size="small"
                    disabled={isDraft}
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {item.name}
                      {isSelected ? (
                        <CheckCircleFilled style={{ color: '#52c41a', marginLeft: 8 }} />
                      ) : null}
                    </span>
                  }
                  description={
                    isDraft ? (
                      <Tag color="orange">Draft — publish before running in workflow</Tag>
                    ) : (
                      <Text type="secondary" code style={{ fontSize: 11 }}>
                        {item.pipeline_uuid}
                      </Text>
                    )
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </Modal>
  );
}
