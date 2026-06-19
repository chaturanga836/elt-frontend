'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  clearOAuthState,
  clearStoredTokens,
  completeManualOAuthCallback,
  ensureValidAccessToken,
  initializeKeycloak,
  parseOAuthCallbackFromUrl,
  profileFromAccessToken,
  refreshTokenIfNeeded,
  shouldUseManualAuthFlow,
} from '@/lib/keycloak';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { UserService } from '@/services/user.service';
import { OrganizationService } from '@/services/organization.service';
import { isSuperAdminToken } from '@/lib/jwt';

export const AUTH_ERROR_KEY = 'auth_error';

function isOAuthErrorOnLogin(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return Boolean(params.get('error') || params.get('error_description'));
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setProfile = useAuthStore((s) => s.setProfile);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const setOrgId = useWorkspaceStore((s) => s.setOrgId);

  useEffect(() => {
    if (pathname !== '/login') return;
    if (parseOAuthCallbackFromUrl()) return;
    if (isOAuthErrorOnLogin()) return;
    clearStoredTokens();
    clearOAuthState();
    clearAuth();
  }, [pathname, clearAuth]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        if (shouldUseManualAuthFlow() && parseOAuthCallbackFromUrl()) {
          await completeManualOAuthCallback();
        }

        await initializeKeycloak();
        if (!alive) return;

        const token = (await refreshTokenIfNeeded()) || localStorage.getItem('token');
        if (!alive) return;

        if (!token) {
          clearAuth();
          return;
        }

        const kcProfile = profileFromAccessToken(token);

        setAuth({
          token,
          username: kcProfile?.username || null,
          email: kcProfile?.email || null,
          isSuperAdmin: isSuperAdminToken(token),
          realmRoles: [],
          workspaceIds: [],
        });

        try {
          const me = await UserService.getMe();
          if (!alive) return;
          setProfile({
            isSuperAdmin: me.is_super_admin,
            realmRoles: me.realm_roles,
            workspaceIds: me.workspace_ids,
            username: me.username,
            email: me.email,
          });
        } catch {
          /* JWT session is enough when backend is misconfigured */
        }

        try {
          const org = await OrganizationService.getDefault();
          if (!alive) return;
          setOrgId(org.organization_id);
        } catch {
          /* optional */
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        sessionStorage.setItem(
          AUTH_ERROR_KEY,
          error instanceof Error ? error.message : 'Sign-in failed',
        );
        clearStoredTokens();
        clearOAuthState();
        clearAuth();
      } finally {
        if (alive) setInitialized(true);
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [setAuth, setProfile, clearAuth, setInitialized, setOrgId]);

  useEffect(() => {
    if (pathname === '/login' || pathname === '/auth/callback') return;
    const id = window.setInterval(() => void ensureValidAccessToken(), 60_000);
    return () => window.clearInterval(id);
  }, [pathname]);

  return <>{children}</>;
}
