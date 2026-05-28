export type JwtPayload = {
  sub?: string;
  email?: string;
  preferred_username?: string;
  realm_access?: { roles?: string[] };
  groups?: string[];
  workspace_groups?: string[];
};

export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function extractRealmRoles(token: string): string[] {
  const payload = parseJwtPayload(token);
  return payload?.realm_access?.roles ?? [];
}

export function isSuperAdminToken(token: string): boolean {
  return extractRealmRoles(token).includes('super_admin');
}
