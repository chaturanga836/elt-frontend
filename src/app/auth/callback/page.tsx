'use client';

import { Alert, Spin, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const { Text } = Typography;

export default function AuthCallbackPage() {
  const router = useRouter();
  const initialized = useAuthStore((s) => s.initialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error_description') || params.get('error');
    if (oauthError) {
      setError(oauthError);
    }
  }, []);

  useEffect(() => {
    if (!initialized || error) return;
    router.replace(isAuthenticated ? '/' : '/login');
  }, [initialized, isAuthenticated, router, error]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <Alert type="error" message="Sign-in failed" description={error} showIcon />
      </div>
    );
  }

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
