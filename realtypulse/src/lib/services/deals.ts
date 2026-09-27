import { createClient } from '@/lib/supabase/server';
import type { Deal } from '@/lib/supabase/types';

export async function listDeals(organizationId: string): Promise<Deal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('deals')
    .select('*, properties ( title ), clients ( name )')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Deal[];
}
