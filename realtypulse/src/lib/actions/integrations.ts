'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentSession } from '@/lib/services/organizations';
import type { FormActionState } from './leads';

function requireAdmin(role: string): string | null {
  if (role !== 'owner' && role !== 'admin') {
    return 'Only owners and admins can manage integrations.';
  }
  return null;
}

const whatsappSchema = z.object({
  whatsapp_phone_number_id: z.string().min(1, 'Phone number ID is required.'),
  whatsapp_access_token: z.string().min(1, 'Access token is required.'),
});

export async function saveWhatsAppIntegration(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };
  const roleError = requireAdmin(session.role);
  if (roleError) return { error: roleError };

  const parsed = whatsappSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const { error } = await supabase.from('integrations').upsert({
    organization_id: session.organizationId,
    whatsapp_phone_number_id: parsed.data.whatsapp_phone_number_id,
    whatsapp_access_token: parsed.data.whatsapp_access_token,
    whatsapp_connected_at: new Date().toISOString(),
    whatsapp_connected_by: session.userId,
  });

  if (error) return { error: error.message };

  revalidatePath('/settings');
  return { success: true };
}

export async function disconnectWhatsAppIntegration(_prev: FormActionState, _formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };
  const roleError = requireAdmin(session.role);
  if (roleError) return { error: roleError };

  const supabase = createClient();
  const { error } = await supabase
    .from('integrations')
    .update({
      whatsapp_phone_number_id: null,
      whatsapp_access_token: null,
      whatsapp_connected_at: null,
      whatsapp_connected_by: null,
    })
    .eq('organization_id', session.organizationId);

  if (error) return { error: error.message };

  revalidatePath('/settings');
  return { success: true };
}

const emailSchema = z.object({
  email_provider: z.string().min(1).default('resend'),
  email_api_key: z.string().min(1, 'API key is required.'),
  email_from_address: z.string().email('Enter a valid from-address.'),
});

export async function saveEmailIntegration(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };
  const roleError = requireAdmin(session.role);
  if (roleError) return { error: roleError };

  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const { error } = await supabase.from('integrations').upsert({
    organization_id: session.organizationId,
    email_provider: parsed.data.email_provider,
    email_api_key: parsed.data.email_api_key,
    email_from_address: parsed.data.email_from_address,
    email_connected_at: new Date().toISOString(),
    email_connected_by: session.userId,
  });

  if (error) return { error: error.message };

  revalidatePath('/settings');
  return { success: true };
}

export async function disconnectEmailIntegration(_prev: FormActionState, _formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };
  const roleError = requireAdmin(session.role);
  if (roleError) return { error: roleError };

  const supabase = createClient();
  const { error } = await supabase
    .from('integrations')
    .update({
      email_api_key: null,
      email_from_address: null,
      email_connected_at: null,
      email_connected_by: null,
    })
    .eq('organization_id', session.organizationId);

  if (error) return { error: error.message };

  revalidatePath('/settings');
  return { success: true };
}
