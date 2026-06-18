'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  clearStoredTokens,
  completeManualOAuthCallback,
  ensureValidAccessToken,
  parseOAuthCallbackFromUrl,
  profileFromAccessToken,
  refreshTokenIfNeeded,
} from '@/lib/keycloak';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { UserService } from '@/services/user.service';
import { OrganizationService } from '@/services/organization.service';
import { isSuperAdminToken } from '@/lib/jwt';

export const AUTH_ERROR_KEY = 'auth_error';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setProfile = useAuthStore((s) => s.setProfile);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const setOrgId = useWorkspaceStore((s) => s.setOrgId);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        const hasOAuthCode = Boolean(parseOAuthCallbackFromUrl());

        if (pathname === '/auth/callback' || hasOAuthCode) {
          await completeManualOAuthCallback();
        }

        const token = await refreshTokenIfNeeded();
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
          /* Backend profile is optional */
        }

        try {
          const org = await OrganizationService.getDefault();
          if (!alive) return;
          setOrgId(org.organization_id);
        } catch {
          /* Default org optional */
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        sessionStorage.setItem(
          AUTH_ERROR_KEY,
          error instanceof Error ? error.message : 'Sign-in failed',
        );
        clearStoredTokens();
        clearAuth();
      } finally {
        if (alive) setInitialized(true);
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [pathname, setAuth, setProfile, clearAuth, setInitialized, setOrgId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (pathname === '/login' || pathname === '/auth/callback') return;
      void ensureValidAccessToken();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [pathname]);

  return <>{children}</>;
}
