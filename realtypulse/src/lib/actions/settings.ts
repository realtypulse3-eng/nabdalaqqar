'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentSession } from '@/lib/services/organizations';
import type { FormActionState } from './leads';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required.'),
  timezone: z.string().min(1),
});

export async function updateProfile(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.full_name, timezone: parsed.data.timezone })
    .eq('id', session.userId);

  if (error) return { error: error.message };

  revalidatePath('/settings');
  return { success: true };
}

const orgSchema = z.object({ name: z.string().min(1, 'Name is required.') });

export async function updateOrganization(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };
  if (session.role !== 'owner' && session.role !== 'admin') {
    return { error: 'Only owners and admins can update organization settings.' };
  }

  const parsed = orgSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const { error } = await supabase
    .from('organizations')
    .update({ name: parsed.data.name })
    .eq('id', session.organizationId);

  if (error) return { error: error.message };

  revalidatePath('/settings');
  return { success: true };
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'agent', 'staff']),
});

export async function inviteTeammate(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };
  if (session.role !== 'owner' && session.role !== 'admin') {
    return { error: 'Only owners and admins can invite teammates.' };
  }

  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Admin client not configured.' };
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email);
  if (error) return { error: error.message };
  if (!data.user) return { error: 'Invite failed.' };

  const { error: membershipError } = await admin.from('memberships').insert({
    organization_id: session.organizationId,
    user_id: data.user.id,
    role: parsed.data.role,
  });

  if (membershipError) return { error: membershipError.message };

  revalidatePath('/settings');
  return { success: true };
}
