import { clsx } from 'clsx';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        'rounded-card border border-white/[0.06] bg-surface bg-gradient-to-b from-white/[0.02] to-transparent p-5',
        className
      )}
    >
      {children}
    </div>
  );
}
