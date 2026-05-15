'use client';

import { useDebouncedFetch } from "@/features/connections/hooks/useDebouncedFetch";
import { TaskResponse, TaskService } from "@/services/task.service";
import { usePipelineStore } from "@/store/usePipeStore";
import { CheckCircleFilled } from "@ant-design/icons";
import { Handle, Position } from "@xyflow/react";
import { Avatar, Card, Flex, Modal, Typography } from "antd";
import { useState } from "react";
import { TaskSelectionModal } from "./TaskSelectionModal";

// ... same imports as above

const { Text } = Typography;

const EndNode = ({ id, data }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const updateNodeData = usePipelineStore((state) => state.updateNodeData);
  const selected = data.config || null;
  const { data: taskResponse, searching, performFetch } = useDebouncedFetch(TaskService.getTaskList);


  
    const onSelect = (item: TaskResponse) => {
      updateNodeData(id, { config: item, task_id: item.id });
      setIsModalOpen(false);
    };
    
  return (
    <div className="end-node">
      <Handle type="target" position={Position.Left} style={{ background: '#f5222d' }} />
      <Card 
        size="small" 
        hoverable
        style={{ 
          width: 120, 
          height: 45, 
          background: '#fff1f0', 
          border: selected ? '1px solid #f5222d' : '1px dashed #ffa39e',
          cursor: 'pointer' 
        }}
        styles={{ body: { padding: '4px 8px' } }}
        onClick={() => setIsModalOpen(true)}
      >
        <Flex align="center" gap={6}>
          <Avatar 
            size={20} 
            shape="square" 
            icon={<CheckCircleFilled />} 
            style={{ backgroundColor: '#f5222d' }} 
          />
          <Text strong style={{ fontSize: '10px' }} ellipsis>
            {selected ? selected.name : 'End Logic'}
          </Text>
        </Flex>
      </Card>
<TaskSelectionModal 
        title="Assign Start Logic"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedId={data.config?.id}
        onSelect={(task) => onSelect(task)}
      />
    </div>
  );
};

export default EndNode;