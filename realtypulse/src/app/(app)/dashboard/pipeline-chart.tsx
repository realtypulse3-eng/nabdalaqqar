'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

export function DashboardPipelineChart({
  data,
  notEnoughData,
}: {
  data: { stage: string; count: number; value: number }[];
  notEnoughData: string;
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return <p className="py-10 text-center text-sm text-ink-muted">{notEnoughData}</p>;
  }

  const chartData = data.map((d) => ({
    stage: d.stage.replace(/_/g, ' '),
    Deals: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
        <XAxis dataKey="stage" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#1F2937', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
          cursor={{ fill: 'rgba(99,102,241,0.08)' }}
        />
        <Bar dataKey="Deals" fill="#6366F1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
