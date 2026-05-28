'use client';

import { useEffect } from 'react';
import {
  completeManualOAuthCallback,
  initializeKeycloak,
  loadUserProfile,
  parseOAuthCallbackFromUrl,
  refreshTokenIfNeeded,
  shouldUseManualAuthFlow,
} from '@/lib/keycloak';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        if (shouldUseManualAuthFlow() && parseOAuthCallbackFromUrl()) {
          await completeManualOAuthCallback();
        }

        const authenticated = await initializeKeycloak();
        if (!alive) return;

        const token = (await refreshTokenIfNeeded()) || localStorage.getItem('token');

        if (!authenticated && !token) {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          clearAuth();
          return;
        }

        if (token) {
          localStorage.setItem('token', token);
          const profile = await loadUserProfile();
          setAuth({
            token,
            username: profile?.username || null,
            email: profile?.email || null,
          });
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
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
