'use client';

import { useEffect } from 'react';
import { initializeKeycloak, loadUserProfile, refreshTokenIfNeeded } from '@/lib/keycloak';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        const authenticated = await initializeKeycloak();
        if (!alive) return;

        if (!authenticated) {
          localStorage.removeItem('token');
          clearAuth();
          return;
        }

        const token = await refreshTokenIfNeeded();
        const profile = await loadUserProfile();

        if (token) {
          localStorage.setItem('token', token);
          setAuth({
            token,
            username: profile?.username || null,
            email: profile?.email || null,
          });
        } else {
          localStorage.removeItem('token');
          clearAuth();
        }
      } catch {
        localStorage.removeItem('token');
        clearAuth();
      } finally {
        if (alive) setInitialized(true);
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [setAuth, clearAuth, setInitialized]);

  return <>{children}</>;
}
