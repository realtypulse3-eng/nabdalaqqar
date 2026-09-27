'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentSession } from '@/lib/services/organizations';

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  status: z.enum(['new', 'contacted', 'qualified', 'nurturing', 'converted', 'lost']),
  source: z.enum(['website', 'referral', 'campaign', 'walk_in', 'portal', 'whatsapp', 'other']),
  budget_min: z.string().optional().or(z.literal('')),
  budget_max: z.string().optional().or(z.literal('')),
  interest: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export interface FormActionState {
  error?: string;
  success?: boolean;
}

function toNumberOrNull(value: string | undefined) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function createLead(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const { error } = await supabase.from('leads').insert({
    organization_id: session.organizationId,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    status: parsed.data.status,
    source: parsed.data.source,
    budget_min: toNumberOrNull(parsed.data.budget_min),
    budget_max: toNumberOrNull(parsed.data.budget_max),
    interest: parsed.data.interest || null,
    notes: parsed.data.notes || null,
    created_by: session.userId,
  });

  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    organization_id: session.organizationId,
    actor_id: session.userId,
    action: 'created a lead',
    entity_type: 'lead',
    metadata: { name: parsed.data.name },
  });

  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateLead(id: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const { error } = await supabase
    .from('leads')
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      status: parsed.data.status,
      source: parsed.data.source,
      budget_min: toNumberOrNull(parsed.data.budget_min),
      budget_max: toNumberOrNull(parsed.data.budget_max),
      interest: parsed.data.interest || null,
      notes: parsed.data.notes || null,
    })
    .eq('id', id)
    .eq('organization_id', session.organizationId);

  if (error) return { error: error.message };

  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteLead(id: string): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const supabase = createClient();
  const { error } = await supabase.from('leads').delete().eq('id', id).eq('organization_id', session.organizationId);
  if (error) return { error: error.message };

  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function convertLeadToClient(id: string): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const supabase = createClient();
  const { data: lead, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('organization_id', session.organizationId)
    .single();

  if (fetchError || !lead) return { error: fetchError?.message ?? 'Lead not found.' };

  const { error: insertError } = await supabase.from('clients').insert({
    organization_id: session.organizationId,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    status: 'prospect',
    notes: lead.notes,
    converted_from_lead_id: lead.id,
    created_by: session.userId,
  });

  if (insertError) return { error: insertError.message };

  await supabase.from('leads').update({ status: 'converted' }).eq('id', id);

  revalidatePath('/leads');
  revalidatePath('/contacts');
  revalidatePath('/dashboard');
  return { success: true };
}
