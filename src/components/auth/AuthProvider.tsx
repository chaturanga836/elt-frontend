'use client';

import { useEffect } from 'react';
import {
  completeManualOAuthCallback,
  ensureValidAccessToken,
  initializeKeycloak,
  loadUserProfile,
  parseOAuthCallbackFromUrl,
  refreshTokenIfNeeded,
  shouldUseManualAuthFlow,
} from '@/lib/keycloak';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { UserService } from '@/services/user.service';
import { OrganizationService } from '@/services/organization.service';
import { isSuperAdminToken } from '@/lib/jwt';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const setOrgId = useWorkspaceStore((s) => s.setOrgId);

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
          const kcProfile = await loadUserProfile();
          let isSuperAdmin = isSuperAdminToken(token);
          let realmRoles: string[] = [];
          let workspaceIds: number[] = [];
          try {
            const me = await UserService.getMe();
            isSuperAdmin = me.is_super_admin;
            realmRoles = me.realm_roles;
            workspaceIds = me.workspace_ids;
          } catch {
            /* API profile optional if backend unreachable */
          }
          try {
            const org = await OrganizationService.getDefault();
            setOrgId(org.organization_id);
          } catch {
            /* Default org optional if backend unreachable */
          }
          setAuth({
            token,
            username: kcProfile?.username || null,
            email: kcProfile?.email || null,
            isSuperAdmin,
            realmRoles,
            workspaceIds,
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
  }, [setAuth, clearAuth, setInitialized, setOrgId]);

  // Proactive refresh on HTTP/manual Keycloak so idle tabs stay signed in
  useEffect(() => {
    if (!shouldUseManualAuthFlow()) return;
    const intervalMs = 60_000;
    const tick = () => {
      void ensureValidAccessToken();
    };
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, []);

  return <>{children}</>;
}
