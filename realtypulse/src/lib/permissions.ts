import type { OrgRole } from '@/lib/supabase/types';

export type Capability = 'create' | 'edit' | 'delete' | 'manage_team' | 'manage_org';

const ROLE_CAPABILITIES: Record<OrgRole, Capability[]> = {
  owner: ['create', 'edit', 'delete', 'manage_team', 'manage_org'],
  admin: ['create', 'edit', 'delete', 'manage_team', 'manage_org'],
  agent: ['create', 'edit'],
  staff: [],
};

export function can(role: OrgRole | undefined | null, capability: Capability): boolean {
  if (!role) return false;
  return ROLE_CAPABILITIES[role].includes(capability);
}
