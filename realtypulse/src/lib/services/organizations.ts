import { createClient } from '@/lib/supabase/server';
import type { OrgRole, Profile } from '@/lib/supabase/types';
import { DEFAULT_AGENTS } from '@/lib/services/ai/default-agents';

export interface CurrentSession {
  userId: string;
  profile: Profile;
  organizationId: string;
  organizationName: string;
  role: OrgRole;
}

// Three distinct outcomes, kept distinct on purpose. Collapsing "no
// user" and "user but no org" into a single null value was the root
// cause of the login <-> onboarding redirect loop: any transient hiccup
// reading the session got treated the same as "needs an organization",
// which could send an already-authenticated user back into a setup
// flow instead of straight through to the app.
export type SessionResult =
  | { status: 'unauthenticated' }
  | { status: 'needs_organization'; userId: string; profile: Profile }
  | { status: 'authenticated'; session: CurrentSession };

export async function getSessionResult(): Promise<SessionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: 'unauthenticated' };

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return { status: 'unauthenticated' };

  const { data: membership } = await supabase
    .from('memberships')
    .select('role, organization_id, organizations ( id, name )')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return { status: 'needs_organization', userId: user.id, profile: profile as Profile };
  }

  const org = Array.isArray(membership.organizations) ? membership.organizations[0] : membership.organizations;

  return {
    status: 'authenticated',
    session: {
      userId: user.id,
      profile: profile as Profile,
      organizationId: membership.organization_id as string,
      organizationName: (org as { name?: string } | null)?.name ?? '',
      role: membership.role as OrgRole,
    },
  };
}

/** Back-compat helper for pages that just want the session or null. */
export async function getCurrentSession(): Promise<CurrentSession | null> {
  const result = await getSessionResult();
  return result.status === 'authenticated' ? result.session : null;
}

/**
 * Creates an organization + owner membership + default (idle) AI agent
 * registry for a user who doesn't have one yet. Safe to call repeatedly
 * and self-healing: if a previous attempt already created an
 * organization owned by this user but failed before attaching a
 * membership (the old RLS-timing bug could do exactly this), this
 * reuses that organization instead of creating a duplicate orphan.
 */
export async function ensureOrganization(userId: string, organizationName: string) {
  const supabase = createClient();

  const { data: existingMembership } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (existingMembership) return;

  let orgId: string;

  const { data: existingOwnedOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingOwnedOrg) {
    orgId = existingOwnedOrg.id;
  } else {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: organizationName, owner_id: userId })
      .select('id')
      .single();

    if (orgError || !org) throw orgError ?? new Error('Failed to create organization');
    orgId = org.id;
  }

  const { error: membershipError } = await supabase
    .from('memberships')
    .insert({ organization_id: orgId, user_id: userId, role: 'owner' });

  if (membershipError) throw membershipError;

  const { count: existingAgentCount } = await supabase
    .from('ai_agents')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  if (!existingAgentCount) {
    await supabase.from('ai_agents').insert(
      DEFAULT_AGENTS.map((agent) => ({
        organization_id: orgId,
        key: agent.key,
        name: agent.name,
        description: agent.description,
        icon: agent.icon,
        capabilities: [...agent.capabilities],
        status: 'idle' as const,
      }))
    );
  }
}

/**
 * Auto-provisions a default-named organization with zero user input.
 * This is the fallback safety net for the one edge case where signup
 * can't create the organization immediately (Supabase email
 * confirmation is turned on, so there's no session yet at signup time):
 * the very first time that user is authenticated afterward, the
 * protected layout calls this instead of showing any kind of "create
 * your workspace" screen. The product requirement is exactly two
 * user-facing auth steps — sign up, sign in — so this never surfaces a
 * third screen; the organization can be renamed anytime in Settings.
 */
export async function ensureOrganizationSilently(userId: string, profile: Profile) {
  const fallbackName = profile.full_name
    ? `${profile.full_name}'s Workspace`
    : `${profile.email.split('@')[0]}'s Workspace`;
  await ensureOrganization(userId, fallbackName);
}
