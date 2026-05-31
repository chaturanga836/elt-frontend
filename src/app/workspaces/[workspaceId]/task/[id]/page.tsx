'use client';

import { useParams } from 'next/navigation';
import TaskCanvas from '../components/TaskCanvas';

export default function EditTaskPage() {
  const params = useParams();
  const raw = params?.id;
  const taskId = typeof raw === 'string' ? Number(raw) : Number(raw?.[0]);

  if (!Number.isFinite(taskId) || taskId < 1) {
    return null;
  }

  return <TaskCanvas taskId={taskId} />;
}
