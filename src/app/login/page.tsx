'use client';

import Link from 'next/link';
import { Alert, Button, Divider, Typography } from 'antd';
import { LoginOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthShell from '@/components/auth/AuthShell';
import LoginMarketingPanel from '@/components/marketing/LoginMarketingPanel';
import { AUTH_ERROR_KEY } from '@/components/auth/AuthProvider';
import { loginWithKeycloak, getKeycloakAuthDiagnostics } from '@/lib/keycloak';
import { useAuthStore } from '@/store/useAuthStore';
import { palette } from '@/constants/theme';
import styles from './login.module.css';

const { Paragraph } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const initialized = useAuthStore((s) => s.initialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [authError, setAuthError] = useState<string | null>(null);
  const [kcDebug, setKcDebug] = useState<ReturnType<typeof getKeycloakAuthDiagnostics> | null>(
    null,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('kc_debug')) {
      setKcDebug(getKeycloakAuthDiagnostics());
    }

    const stored = sessionStorage.getItem(AUTH_ERROR_KEY);
    if (stored) {
      setAuthError(stored);
      sessionStorage.removeItem(AUTH_ERROR_KEY);
    }

    const oauthError = params.get('error_description') || params.get('error');
    if (oauthError) {
      setAuthError(oauthError);
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  useEffect(() => {
    if (!initialized || !isAuthenticated) return;
    router.replace('/workspaces');
  }, [initialized, isAuthenticated, router]);

  return (
    <AuthShell
      layout="split"
      title="Welcome back"
      subtitle="Sign in to manage workspaces, pipelines, and connections."
      marketing={<LoginMarketingPanel />}
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
      {kcDebug ? (
        <Alert
          type="info"
          title="Keycloak URL diagnostics (?kc_debug=1)"
          description={
            <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(kcDebug, null, 2)}
            </pre>
          }
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {authError ? (
        <Alert
          type="error"
          title="Sign-in failed"
          description={authError}
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Button
        type="primary"
        size="large"
        block
        icon={<LoginOutlined />}
        onClick={() => {
          setAuthError(null);
          void loginWithKeycloak();
        }}
        style={{ height: 48, fontSize: 15 }}
      >
        Continue with Keycloak
      </Button>

      <Divider plain style={{ margin: '20px 0 16px', fontSize: 12, color: palette.textMuted }}>
        Secure access
      </Divider>

      <Paragraph style={{ fontSize: 13, marginBottom: 0, color: palette.textSecondary }}>
        <LockOutlined style={{ marginRight: 6 }} />
        SSO via your identity provider. After sign-in, pick or create a workspace.
      </Paragraph>
    </AuthShell>
  );
}
