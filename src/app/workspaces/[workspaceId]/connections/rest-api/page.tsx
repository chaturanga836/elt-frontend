'use client';

import { useEffect } from 'react';
import RestApiForm from '@/features/connections/components/RestApiForm';
import { useConnectionStore } from '@/store/useConnectionStore';

export default function CreateRestPage() {
  const reset = useConnectionStore((s) => s.reset);

  useEffect(() => {
    reset();
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <div className="p-8">
      <RestApiForm />
    </div>
  );
}
