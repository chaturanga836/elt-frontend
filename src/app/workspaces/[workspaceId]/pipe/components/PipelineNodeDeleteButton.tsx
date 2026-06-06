'use client';

import { Button, Modal } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { Node } from '@xyflow/react';
import { usePipelineStore } from '@/store/usePipeStore';
import styles from '../pipeline-editor.module.css';

type PipelineNodeDeleteButtonProps = {
  nodeId: string;
  nodeLabel?: string;
};

export default function PipelineNodeDeleteButton({
  nodeId,
  nodeLabel,
}: PipelineNodeDeleteButtonProps) {
  const deleteNodes = usePipelineStore((s) => s.deleteNodes);
  const nodes = usePipelineStore((s) => s.nodes);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const label = nodeLabel?.trim() || 'this node';

    Modal.confirm({
      title: 'Remove node?',
      content: `Remove "${label}" from this pipeline? Connected links will be updated automatically.`,
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      onOk: () => deleteNodes([node as Node]),
    });
  };

  return (
    <Button
      type="text"
      size="small"
      danger
      className={styles.pipelineNodeDeleteBtn}
      icon={<DeleteOutlined />}
      onClick={handleClick}
      title="Remove node"
      aria-label="Remove node"
    />
  );
}
