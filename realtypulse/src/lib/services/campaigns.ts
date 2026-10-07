import { createClient } from '@/lib/supabase/server';
import type { Campaign } from '@/lib/supabase/types';

export async function listCampaigns(organizationId: string): Promise<Campaign[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Campaign[];
}
