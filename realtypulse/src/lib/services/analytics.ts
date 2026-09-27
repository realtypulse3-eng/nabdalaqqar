import { createClient } from '@/lib/supabase/server';

export interface LeadsBySource {
  source: string;
  count: number;
}

export interface DealsByMonth {
  month: string;
  value: number;
  count: number;
}

export async function getLeadsBySource(organizationId: string): Promise<LeadsBySource[]> {
  const supabase = createClient();
  const { data } = await supabase.from('leads').select('source').eq('organization_id', organizationId);

  const counts = new Map<string, number>();
  (data ?? []).forEach((row) => counts.set(row.source, (counts.get(row.source) ?? 0) + 1));

  return Array.from(counts.entries()).map(([source, count]) => ({ source, count }));
}

export async function getClosedDealsByMonth(organizationId: string): Promise<DealsByMonth[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('deals')
    .select('value, closing_date, status')
    .eq('organization_id', organizationId)
    .eq('status', 'closed_won');

  const buckets = new Map<string, { value: number; count: number }>();
  (data ?? []).forEach((row) => {
    if (!row.closing_date) return;
    const month = new Date(row.closing_date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    const existing = buckets.get(month) ?? { value: 0, count: 0 };
    buckets.set(month, { value: existing.value + Number(row.value ?? 0), count: existing.count + 1 });
  });

  return Array.from(buckets.entries()).map(([month, v]) => ({ month, ...v }));
}

export async function getPropertyStatusBreakdown(organizationId: string) {
  const supabase = createClient();
  const { data } = await supabase.from('properties').select('status').eq('organization_id', organizationId);

  const counts = new Map<string, number>();
  (data ?? []).forEach((row) => counts.set(row.status, (counts.get(row.status) ?? 0) + 1));

  return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
}
