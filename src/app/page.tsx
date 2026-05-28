'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { useAuthStore } from '@/store/useAuthStore';

export default function Home() {
  const router = useRouter();
  const initialized = useAuthStore((s) => s.initialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!initialized) return;
    if (isAuthenticated) {
      router.replace('/workspaces');
    } else {
      router.replace('/login');
    }
  }, [initialized, isAuthenticated, router]);

  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <Spin size="large" />
    </div>
  );
}
