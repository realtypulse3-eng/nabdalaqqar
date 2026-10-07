'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentSession } from '@/lib/services/organizations';
import type { FormActionState } from './leads';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'past', 'prospect']),
  tags: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export async function createClientContact(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const tags = parsed.data.tags
    ? parsed.data.tags.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const { error } = await supabase.from('clients').insert({
    organization_id: session.organizationId,
    assigned_to: session.userId,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    status: parsed.data.status,
    tags,
    notes: parsed.data.notes || null,
    created_by: session.userId,
  });

  if (error) return { error: error.message };

  revalidatePath('/contacts');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateClientContact(id: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const tags = parsed.data.tags
    ? parsed.data.tags.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const { error } = await supabase
    .from('clients')
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      status: parsed.data.status,
      tags,
      notes: parsed.data.notes || null,
    })
    .eq('id', id)
    .eq('organization_id', session.organizationId);

  if (error) return { error: error.message };

  revalidatePath('/contacts');
  return { success: true };
}

export async function deleteClientContact(id: string): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const supabase = createClient();
  const { error } = await supabase.from('clients').delete().eq('id', id).eq('organization_id', session.organizationId);
  if (error) return { error: error.message };

  revalidatePath('/contacts');
  return { success: true };
}
