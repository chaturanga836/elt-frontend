'use client';

import { Spin, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const { Text } = Typography;

export default function AuthCallbackPage() {
  const router = useRouter();
  const initialized = useAuthStore((s) => s.initialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!initialized) return;
    router.replace(isAuthenticated ? '/' : '/login');
  }, [initialized, isAuthenticated, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">Completing sign-in...</Text>
        </div>
      </div>
    </div>
  );
}
