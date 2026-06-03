'use client';

import { Button, Card, Divider, Typography } from 'antd';
import { LoginOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginMarketingPanel from '@/components/marketing/LoginMarketingPanel';
import { BRAND_NAME } from '@/constants/brand';
import { loginWithKeycloak } from '@/lib/keycloak';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './login.module.css';

const { Title, Paragraph, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) router.replace('/workspaces');
  }, [isAuthenticated, router]);

  const handleLogin = () => {
    loginWithKeycloak(`${window.location.origin}/auth/callback`);
  };

  return (
    <div className={styles.page}>
      <LoginMarketingPanel />

      <div className={styles.authPanel}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <Card className={styles.authCard}>
            <Title level={3} style={{ textAlign: 'center', marginTop: 0, marginBottom: 4 }}>
              Welcome back
            </Title>
            <Paragraph
              type="secondary"
              style={{ textAlign: 'center', marginBottom: 28, fontSize: 14 }}
            >
              Sign in to manage workspaces, pipelines, and connections.
            </Paragraph>

            <Button
              type="primary"
              size="large"
              block
              icon={<LoginOutlined />}
              onClick={handleLogin}
              style={{ height: 48, fontSize: 15 }}
            >
              Continue with Keycloak
            </Button>

            <Divider plain style={{ margin: '20px 0 16px', fontSize: 12 }}>
              Secure access
            </Divider>

            <Paragraph
              type="secondary"
              style={{ fontSize: 13, marginBottom: 0, textAlign: 'center' }}
            >
              <LockOutlined style={{ marginRight: 6 }} />
              SSO via your identity provider. After sign-in, pick or create a workspace.
            </Paragraph>
          </Card>

          <Text
            type="secondary"
            style={{ display: 'block', textAlign: 'center', marginTop: 20, fontSize: 12 }}
          >
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </Text>
        </div>
      </div>
    </div>
  );
}
