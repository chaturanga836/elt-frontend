'use client';

import Link from 'next/link';
import { Button, Typography } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import { redirectToKeycloakForgotPassword } from '@/lib/keycloak';
import AuthShell from '@/components/auth/AuthShell';

const { Paragraph } = Typography;

export default function ForgotPasswordPage() {
  const handleReset = () => {
    redirectToKeycloakForgotPassword(`${window.location.origin}/login`);
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Password resets are handled securely through Keycloak."
      footer={
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
          Remember your password? <Link href="/login">Back to sign in</Link>
        </div>
      }
    >
      <Paragraph style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
        Click below to open the Keycloak password reset flow. You will receive instructions
        to reset your password via email if your account is configured for it.
      </Paragraph>

      <Button
        type="primary"
        size="large"
        block
        icon={<KeyOutlined />}
        onClick={handleReset}
        style={{ height: 48 }}
      >
        Reset via Keycloak
      </Button>
    </AuthShell>
  );
}
