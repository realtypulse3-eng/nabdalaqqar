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

const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB

export async function uploadOrganizationLogo(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };
  if (session.role !== 'owner' && session.role !== 'admin') {
    return { error: 'Only owners and admins can change the organization logo.' };
  }

  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a logo file first.' };
  }
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return { error: 'Logo must be a PNG, JPEG, WEBP, or SVG image.' };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { error: 'Logo must be smaller than 2MB.' };
  }

  const supabase = createClient();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  // Fixed filename per org (not per-upload) so re-uploading replaces the
  // old logo instead of accumulating orphaned files, and so every page
  // can reference one stable path.
  const path = `${session.organizationId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('org-logos')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from('org-logos').getPublicUrl(path);

  // Cache-bust so the new logo shows immediately instead of a stale
  // browser/CDN-cached copy at the same URL.
  const versionedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('organizations')
    .update({ logo_url: versionedUrl })
    .eq('id', session.organizationId);

  if (updateError) return { error: updateError.message };

  revalidatePath('/settings');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function removeOrganizationLogo(_prev: FormActionState, _formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };
  if (session.role !== 'owner' && session.role !== 'admin') {
    return { error: 'Only owners and admins can change the organization logo.' };
  }

  const supabase = createClient();
  const { error } = await supabase.from('organizations').update({ logo_url: null }).eq('id', session.organizationId);
  if (error) return { error: error.message };

  revalidatePath('/settings');
  revalidatePath('/', 'layout');
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
