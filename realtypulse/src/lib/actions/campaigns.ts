'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentSession } from '@/lib/services/organizations';
import type { FormActionState } from './leads';

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  channel: z.enum(['email', 'whatsapp', 'sms', 'social', 'ads', 'other']),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
  budget: z.string().optional().or(z.literal('')),
});

export async function createCampaign(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const parsed = campaignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const { error } = await supabase.from('campaigns').insert({
    organization_id: session.organizationId,
    created_by: session.userId,
    name: parsed.data.name,
    channel: parsed.data.channel,
    status: parsed.data.status,
    budget: parsed.data.budget ? Number(parsed.data.budget) : null,
  });

  if (error) return { error: error.message };

  revalidatePath('/campaigns');
  return { success: true };
}

export async function deleteCampaign(id: string): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const supabase = createClient();
  const { error } = await supabase.from('campaigns').delete().eq('id', id).eq('organization_id', session.organizationId);
  if (error) return { error: error.message };

  revalidatePath('/campaigns');
  return { success: true };
}
