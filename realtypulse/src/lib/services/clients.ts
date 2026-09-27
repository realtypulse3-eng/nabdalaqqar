import { createClient } from '@/lib/supabase/server';
import type { Client } from '@/lib/supabase/types';

export async function listClients(organizationId: string): Promise<Client[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Client | null;
}
