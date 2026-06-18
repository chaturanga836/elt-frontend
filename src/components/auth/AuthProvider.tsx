'use client';

import { useEffect } from 'react';
import {
  clearStoredTokens,
  completeManualOAuthCallback,
  ensureValidAccessToken,
  initializeKeycloak,
  parseOAuthCallbackFromUrl,
  profileFromAccessToken,
  refreshTokenIfNeeded,
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
        if (parseOAuthCallbackFromUrl()) {
          await completeManualOAuthCallback();
        }

        const authenticated = await initializeKeycloak();
        if (!alive) return;

        const token = await refreshTokenIfNeeded();

        if (!authenticated && !token) {
          clearStoredTokens();
          clearAuth();
          return;
        }

        if (token) {
          const kcProfile = profileFromAccessToken(token);
          let isSuperAdmin = isSuperAdminToken(token);
          let realmRoles: string[] = [];
          let workspaceIds: number[] = [];
          try {
            const me = await UserService.getMe();
            isSuperAdmin = me.is_super_admin;
            realmRoles = me.realm_roles;
            workspaceIds = me.workspace_ids;
          } catch {
            if (!localStorage.getItem('token')) {
              clearAuth();
              return;
            }
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
  }, [setAuth, clearAuth, setInitialized, setOrgId]);

  // Proactive refresh so idle tabs stay signed in
  useEffect(() => {
    const intervalMs = 60_000;
    const tick = () => {
      void ensureValidAccessToken();
    };
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, []);

  return <>{children}</>;
}
