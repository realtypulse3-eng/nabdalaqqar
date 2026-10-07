'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentSession } from '@/lib/services/organizations';
import type { FormActionState } from './leads';

const dealSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  value: z.string().min(1, 'Value is required.'),
  status: z.enum(['open', 'negotiation', 'under_contract', 'closed_won', 'closed_lost']),
  probability: z.string().optional().or(z.literal('')),
  closing_date: z.string().optional().or(z.literal('')),
  property_id: z.string().optional().or(z.literal('')),
  client_id: z.string().optional().or(z.literal('')),
});

export async function createDeal(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const parsed = dealSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const { error } = await supabase.from('deals').insert({
    organization_id: session.organizationId,
    owner_id: session.userId,
    title: parsed.data.title,
    value: Number(parsed.data.value) || 0,
    status: parsed.data.status,
    probability: parsed.data.probability ? Number(parsed.data.probability) : 50,
    closing_date: parsed.data.closing_date || null,
    property_id: parsed.data.property_id || null,
    client_id: parsed.data.client_id || null,
  });

  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    organization_id: session.organizationId,
    actor_id: session.userId,
    action: 'opened a deal',
    entity_type: 'deal',
    metadata: { title: parsed.data.title },
  });

  revalidatePath('/deals');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateDealStatus(id: string, status: string): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const supabase = createClient();
  const { error } = await supabase
    .from('deals')
    .update({ status })
    .eq('id', id)
    .eq('organization_id', session.organizationId);

  if (error) return { error: error.message };

  revalidatePath('/deals');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteDeal(id: string): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const supabase = createClient();
  const { error } = await supabase.from('deals').delete().eq('id', id).eq('organization_id', session.organizationId);
  if (error) return { error: error.message };

  revalidatePath('/deals');
  revalidatePath('/dashboard');
  return { success: true };
}
