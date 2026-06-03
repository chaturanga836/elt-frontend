'use client';

import { Button, Card, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AppBrand from '@/components/brand/AppBrand';
import { loginWithKeycloak } from '@/lib/keycloak';
import { useAuthStore } from '@/store/useAuthStore';

const { Title, Paragraph } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) router.replace('/workspaces');
  }, [isAuthenticated, router]);

  const handleLogin = () => {
    console.log(`${window.location.origin}/auth/callback`);
    loginWithKeycloak(`${window.location.origin}/auth/callback`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(160deg, #f5f7fa 0%, #e8ecf1 100%)',
      }}
    >
      <AppBrand variant="login" />
      <Card style={{ width: 420, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          Sign in
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Sign in with Keycloak. After login you will choose or create a workspace.
        </Paragraph>
        <Button
          type="primary"
          size="large"
          block
          onClick={handleLogin}
        >
          Continue with Keycloak
        </Button>
      </Card>
    </div>
  );
}
