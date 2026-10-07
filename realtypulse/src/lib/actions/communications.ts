'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentSession } from '@/lib/services/organizations';
import type { FormActionState } from './leads';

const messageSchema = z.object({
  conversation_id: z.string().min(1),
  body: z.string().min(1, 'Message cannot be empty.'),
});

export async function sendMessage(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid message.' };

  const supabase = createClient();
  const { error } = await supabase.from('messages').insert({
    conversation_id: parsed.data.conversation_id,
    organization_id: session.organizationId,
    sender_type: 'agent_user',
    sender_id: session.userId,
    body: parsed.data.body,
  });

  if (error) return { error: error.message };

  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', parsed.data.conversation_id);

  revalidatePath('/communications');
  return { success: true };
}

const conversationSchema = z.object({
  client_id: z.string().optional().or(z.literal('')),
  lead_id: z.string().optional().or(z.literal('')),
  channel: z.enum(['email', 'whatsapp', 'sms', 'social', 'ads', 'other']),
  subject: z.string().optional().or(z.literal('')),
});

export async function createConversation(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const parsed = conversationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const { error } = await supabase.from('conversations').insert({
    organization_id: session.organizationId,
    client_id: parsed.data.client_id || null,
    lead_id: parsed.data.lead_id || null,
    channel: parsed.data.channel,
    subject: parsed.data.subject || null,
  });

  if (error) return { error: error.message };

  revalidatePath('/communications');
  return { success: true };
}
