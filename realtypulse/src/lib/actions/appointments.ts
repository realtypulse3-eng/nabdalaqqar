'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentSession } from '@/lib/services/organizations';
import type { FormActionState } from './leads';

const appointmentSchema = z.object({
  starts_at: z.string().min(1, 'Start time is required.'),
  type: z.string().min(1),
  client_id: z.string().optional().or(z.literal('')),
  property_id: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export async function createAppointment(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const parsed = appointmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const { error } = await supabase.from('appointments').insert({
    organization_id: session.organizationId,
    agent_id: session.userId,
    starts_at: new Date(parsed.data.starts_at).toISOString(),
    type: parsed.data.type,
    client_id: parsed.data.client_id || null,
    property_id: parsed.data.property_id || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { error: error.message };

  revalidatePath('/calendar');
  return { success: true };
}

export async function deleteAppointment(id: string): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const supabase = createClient();
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)
    .eq('organization_id', session.organizationId);

  if (error) return { error: error.message };

  revalidatePath('/calendar');
  return { success: true };
}
