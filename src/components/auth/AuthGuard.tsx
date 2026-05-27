'use client';

import { Spin } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const PUBLIC_PATHS = new Set(['/login', '/auth/callback']);

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const initialized = useAuthStore((s) => s.initialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!initialized) return;
    if (PUBLIC_PATHS.has(pathname)) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [initialized, isAuthenticated, pathname, router]);

  if (!initialized) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated && !PUBLIC_PATHS.has(pathname)) {
    return null;
  }

  return <>{children}</>;
}
