'use client';

import Image from 'next/image';
import { Button, Card, Divider, Drawer, Typography } from 'antd';
import { LoginOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppBrand from '@/components/brand/AppBrand';
import LoginMarketingPanel from '@/components/marketing/LoginMarketingPanel';
import { BRAND_BANNER_SRC, BRAND_NAME } from '@/constants/brand';
import { loginWithKeycloak } from '@/lib/keycloak';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './login.module.css';

const { Title, Paragraph, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/workspaces');
  }, [isAuthenticated, router]);

  const handleLogin = () => {
    loginWithKeycloak(`${window.location.origin}/auth/callback`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <AppBrand variant="header" />
        <Button
          type="primary"
          size="large"
          icon={<LoginOutlined />}
          onClick={() => setDrawerOpen(true)}
        >
          Log in
        </Button>
      </header>

      <div className={styles.bannerWrap}>
        <Image
          src={BRAND_BANNER_SRC}
          alt={`${BRAND_NAME} platform`}
          fill
          priority
          sizes="100vw"
          className={styles.bannerImg}
        />
      </div>

      <main className={styles.main}>
        <LoginMarketingPanel />
      </main>

      <Drawer
        title="Sign in"
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={400}
        classNames={{ body: styles.drawerBody }}
      >
        <Card className={styles.authCard} bordered={false}>
          <Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
            Welcome back
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 24, fontSize: 14 }}>
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

          <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
            <LockOutlined style={{ marginRight: 6 }} />
            SSO via your identity provider. After sign-in, pick or create a workspace.
          </Paragraph>
        </Card>

        <Text
          type="secondary"
          style={{ display: 'block', textAlign: 'center', marginTop: 24, fontSize: 12 }}
        >
          © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
        </Text>
      </Drawer>
    </div>
  );
}
