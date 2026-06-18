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
  const setProfile = useAuthStore((s) => s.setProfile);
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
          const isSuperAdmin = isSuperAdminToken(token);

          // Sign in immediately so /auth/callback → /workspaces works even if the API is down.
          setAuth({
            token,
            username: kcProfile?.username || null,
            email: kcProfile?.email || null,
            isSuperAdmin,
            realmRoles: [],
            workspaceIds: [],
          });

          try {
            const me = await UserService.getMe();
            setProfile({
              isSuperAdmin: me.is_super_admin,
              realmRoles: me.realm_roles,
              workspaceIds: me.workspace_ids,
              username: me.username,
              email: me.email,
            });
          } catch {
            /* Backend profile is optional during sign-in */
          }
          try {
            const org = await OrganizationService.getDefault();
            setOrgId(org.organization_id);
          } catch {
            /* Default org optional if backend unreachable */
          }
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        const recovered = await refreshTokenIfNeeded();
        if (recovered) {
          const kcProfile = profileFromAccessToken(recovered);
          setAuth({
            token: recovered,
            username: kcProfile?.username || null,
            email: kcProfile?.email || null,
            isSuperAdmin: isSuperAdminToken(recovered),
          });
        } else {
          clearStoredTokens();
          clearAuth();
        }
      } finally {
        if (alive) setInitialized(true);
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [setAuth, setProfile, clearAuth, setInitialized, setOrgId]);

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
