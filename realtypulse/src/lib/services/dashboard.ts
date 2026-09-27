import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  totalLeads: number;
  activeProperties: number;
  closedDeals: number;
  revenue: number;
  conversionRate: number | null;
  pipelineByStage: { stage: string; count: number; value: number }[];
}

export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  const supabase = createClient();

  const [{ count: totalLeads }, { count: activeProperties }, { data: deals }, { count: convertedLeads }] =
    await Promise.all([
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId),
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active'),
      supabase.from('deals').select('status, value').eq('organization_id', organizationId),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'converted'),
    ]);

  const dealRows = deals ?? [];
  const closedDeals = dealRows.filter((d) => d.status === 'closed_won').length;
  const revenue = dealRows
    .filter((d) => d.status === 'closed_won')
    .reduce((sum, d) => sum + Number(d.value ?? 0), 0);

  const stageOrder = ['open', 'negotiation', 'under_contract', 'closed_won', 'closed_lost'];
  const pipelineByStage = stageOrder.map((stage) => {
    const rows = dealRows.filter((d) => d.status === stage);
    return {
      stage,
      count: rows.length,
      value: rows.reduce((sum, d) => sum + Number(d.value ?? 0), 0),
    };
  });

  const conversionRate =
    totalLeads && totalLeads > 0 ? Math.round(((convertedLeads ?? 0) / totalLeads) * 1000) / 10 : null;

  return {
    totalLeads: totalLeads ?? 0,
    activeProperties: activeProperties ?? 0,
    closedDeals,
    revenue,
    conversionRate,
    pipelineByStage,
  };
}

export async function getRecentActivity(organizationId: string, limit = 8) {
  const supabase = createClient();
  const { data } = await supabase
    .from('activity_log')
    .select('id, action, entity_type, metadata, created_at, actor_id, profiles ( full_name )')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getUpcomingTasks(organizationId: string, limit = 6) {
  const supabase = createClient();
  const { data } = await supabase
    .from('tasks')
    .select('id, title, due_date, priority, status')
    .eq('organization_id', organizationId)
    .in('status', ['todo', 'in_progress'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(limit);
  return data ?? [];
}
