import { Card } from './card';

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-2 font-sans text-2xl font-semibold tracking-[-0.02em] text-ink [font-feature-settings:'tnum'_1]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </Card>
  );
}
