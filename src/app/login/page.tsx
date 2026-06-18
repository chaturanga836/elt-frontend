'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button, Divider, Typography } from 'antd';
import { LoginOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AuthShell from '@/components/auth/AuthShell';
import LoginMarketingPanel from '@/components/marketing/LoginMarketingPanel';
import { BRAND_BANNER_SRC, BRAND_NAME } from '@/constants/brand';
import { loginWithKeycloak } from '@/lib/keycloak';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './login.module.css';

const { Paragraph } = Typography;

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
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage workspaces, pipelines, and connections."
      marketing={
        <>
          <div className={styles.bannerWrap}>
            <Image
              src={BRAND_BANNER_SRC}
              alt={`${BRAND_NAME} platform`}
              fill
              priority
              sizes="(max-width: 960px) 100vw, 960px"
              className={styles.bannerImg}
            />
            <div className={styles.bannerOverlay} />
          </div>
          <LoginMarketingPanel />
        </>
      }
      footer={
        <div className={styles.authLinks}>
          <span>
            New here? <Link href="/register">Create account</Link>
          </span>
          <span>
            <Link href="/forgot-password">Forgot password?</Link>
          </span>
        </div>
      }
    >
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

      <Divider plain style={{ margin: '20px 0 16px', fontSize: 12, color: '#64748b' }}>
        Secure access
      </Divider>

      <Paragraph style={{ fontSize: 13, marginBottom: 0, color: '#94a3b8' }}>
        <LockOutlined style={{ marginRight: 6 }} />
        SSO via your identity provider. After sign-in, pick or create a workspace.
      </Paragraph>
    </AuthShell>
  );
}
