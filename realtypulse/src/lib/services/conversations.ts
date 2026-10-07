import { createClient } from '@/lib/supabase/server';
import type { Conversation, Message } from '@/lib/supabase/types';

export async function listConversations(organizationId: string): Promise<Conversation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*, clients ( name ), leads ( name )')
    .eq('organization_id', organizationId)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Conversation[];
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Message[];
}
