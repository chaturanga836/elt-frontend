'use client';

import TaskPickerModal from '@/features/orchestration/TaskPickerModal';
import { TaskResponse } from '@/services/task.service';

interface TaskSelectionModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSelect: (task: TaskResponse) => void;
  selectedId?: number | string | null;
}

/** @deprecated Prefer TaskPickerModal — kept for existing imports. */
export const TaskSelectionModal = (props: TaskSelectionModalProps) => (
  <TaskPickerModal {...props} />
);

export default TaskSelectionModal;
