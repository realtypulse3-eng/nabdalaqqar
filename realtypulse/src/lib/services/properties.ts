import { createClient } from '@/lib/supabase/server';
import type { Property } from '@/lib/supabase/types';

export async function listProperties(organizationId: string): Promise<Property[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Property[];
}

export async function getProperty(id: string): Promise<Property | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Property | null;
}
