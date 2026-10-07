'use client';

import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from 'recharts';
import { useI18n } from '@/lib/i18n/i18n-provider';
import { Card } from '@/components/ui/card';
import type { DealsByMonth, LeadsBySource } from '@/lib/services/analytics';

const COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-ink">{title}</h2>
      {children}
    </Card>
  );
}

export function AnalyticsClient({
  leadsBySource,
  dealsByMonth,
  propertyStatus,
}: {
  leadsBySource: LeadsBySource[];
  dealsByMonth: DealsByMonth[];
  propertyStatus: { status: string; count: number }[];
}) {
  const { t } = useI18n();
  const notEnough = t('analytics.notEnoughData');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold tracking-[-0.02em] text-ink">{t('analytics.title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('analytics.subtitle')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t('nav.leads')}>
          {leadsBySource.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">{notEnough}</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={leadsBySource}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="source" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" fill="#06B6D4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t('dashboard.revenue')}>
          {dealsByMonth.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">{notEnough}</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dealsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t('nav.properties')}>
          {propertyStatus.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">{notEnough}</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={propertyStatus} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {propertyStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
