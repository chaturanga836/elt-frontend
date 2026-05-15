'use client';

import { useRouter } from 'next/navigation';
import { Modal } from 'antd';
import TaskCanvas from '@/app/task/components/TaskCanvas';

export default function TaskInterceptPage() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <Modal
      open={true}
      onCancel={handleClose}
      footer={null}
      width="100vw"
      centered
      // This is the most common fix for "invisible" parallel route modals
      getContainer={() => document.body}
      className="fullscreen-modal"
      wrapClassName="fullscreen-modal-container"
      transitionName=""
      maskTransitionName=""
    // ... rest of your props
    >
      <TaskCanvas />
    </Modal>
  );
}