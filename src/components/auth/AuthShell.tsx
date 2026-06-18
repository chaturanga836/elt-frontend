'use client';

import Link from 'next/link';
import { Typography } from 'antd';
import AppBrand from '@/components/brand/AppBrand';
import { BRAND_NAME } from '@/constants/brand';
import styles from './auth.module.css';

const { Title, Paragraph } = Typography;

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
  marketing?: React.ReactNode;
  footer?: React.ReactNode;
};

export default function AuthShell({
  title,
  subtitle,
  children,
  wide,
  marketing,
  footer,
}: AuthShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.navbar}>
        <AppBrand variant="header" />
      </header>

      <div className={styles.body}>
        <div className={`${styles.card} ${wide ? styles.cardWide : ''}`}>
          <Title level={3} className={styles.title}>
            {title}
          </Title>
          {subtitle && (
            <Paragraph className={styles.subtitle}>{subtitle}</Paragraph>
          )}
          {children}
          {footer ?? (
            <div className={styles.linkRow}>
              <Link href="/login">Sign in</Link>
              <Link href="/register">Create account</Link>
              <Link href="/forgot-password">Forgot password</Link>
            </div>
          )}
        </div>

        {marketing && <div className={styles.marketingSection}>{marketing}</div>}

        <Paragraph className={styles.footer}>
          © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
        </Paragraph>
      </div>
    </div>
  );
}
