import { LanguageSwitcher } from '@/components/language-switcher';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-control bg-gradient-to-br from-primary to-cyan text-sm font-bold text-white">
              R
            </div>
            <span className="text-sm font-semibold text-ink">RealtyPulse AI</span>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="rounded-card border border-white/[0.06] bg-surface p-8">
          <h1 className="font-sans text-2xl font-semibold tracking-[-0.02em] text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
