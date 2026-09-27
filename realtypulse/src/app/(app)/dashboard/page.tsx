import { getCurrentSession } from '@/lib/services/organizations';
import { getDashboardStats, getRecentActivity, getUpcomingTasks } from '@/lib/services/dashboard';
import { getDictionary, getLocale } from '@/lib/i18n/get-dictionary';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { DashboardPipelineChart } from './pipeline-chart';

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const dict = getDictionary(getLocale());
  const t = (path: string, vars?: Record<string, string | number>) => {
    const value = path.split('.').reduce<any>((acc, key) => acc?.[key], dict);
    if (typeof value !== 'string') return path;
    return vars ? Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, String(v)), value) : value;
  };

  const [stats, activity, tasks] = await Promise.all([
    getDashboardStats(session.organizationId),
    getRecentActivity(session.organizationId),
    getUpcomingTasks(session.organizationId),
  ]);

  const displayName = session.profile.full_name?.split(' ')[0] ?? session.profile.email;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold tracking-[-0.02em] text-ink md:text-[28px]">
          {t('dashboard.greeting', { name: displayName })}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label={t('dashboard.totalLeads')} value={stats.totalLeads} />
        <StatCard label={t('dashboard.activeProperties')} value={stats.activeProperties} />
        <StatCard label={t('dashboard.closedDeals')} value={stats.closedDeals} />
        <StatCard
          label={t('dashboard.revenue')}
          value={stats.revenue.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
        />
        <StatCard
          label={t('dashboard.conversionRate')}
          value={stats.conversionRate !== null ? `${stats.conversionRate}%` : '—'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink">{t('dashboard.pipelineByStage')}</h2>
          <DashboardPipelineChart data={stats.pipelineByStage} notEnoughData={t('analytics.notEnoughData')} />
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-ink">{t('dashboard.upcomingTasks')}</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-ink-muted">{t('empty.tasks')}</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    <p className="text-ink">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-ink-faint">{new Date(task.due_date).toLocaleDateString()}</p>
                    )}
                  </div>
                  <Badge tone={task.priority === 'urgent' || task.priority === 'high' ? 'danger' : 'neutral'}>
                    {task.priority}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-ink">{t('dashboard.recentActivity')}</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-ink-muted">{t('empty.activity')}</p>
        ) : (
          <ul className="space-y-3">
            {activity.map((item: any) => (
              <li key={item.id} className="flex items-center justify-between border-b border-white/5 pb-3 text-sm last:border-0 last:pb-0">
                <div>
                  <span className="text-ink">{item.action}</span>{' '}
                  <span className="text-ink-faint">· {item.entity_type}</span>
                </div>
                <span className="text-xs text-ink-faint">{new Date(item.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
