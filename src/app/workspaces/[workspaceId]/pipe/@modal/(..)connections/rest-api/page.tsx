'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from 'antd';
import RestApiForm from '@/features/connections/components/RestApiForm';
import { useConnectionStore } from '@/store/useConnectionStore';

export default function RestConnectionCreateInterceptPage() {
  const router = useRouter();
  const reset = useConnectionStore((s) => s.reset);

  useEffect(() => {
    reset();
    return () => {
      reset();
    };
  }, [reset]);

  const handleClose = () => {
    router.back();
  };

  return (
    <Modal
      open
      onCancel={handleClose}
      footer={null}
      width="100vw"
      centered
      getContainer={() => document.body}
      className="fullscreen-modal"
      wrapClassName="fullscreen-modal-container"
      transitionName=""
      maskTransitionName=""
    >
      <RestApiForm />
    </Modal>
  );
}
