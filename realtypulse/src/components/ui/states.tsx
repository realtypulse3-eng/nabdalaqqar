'use client';

import { useI18n } from '@/lib/i18n/i18n-provider';

export function LoadingState() {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center py-16 text-sm text-ink-muted">
      <span className="me-2 h-4 w-4 animate-spin rounded-full border-2 border-border-strong border-t-primary" />
      {t('common.loading')}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border-strong/60 py-16 text-center">
      <p className="max-w-sm text-sm text-ink-muted">{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{message}</div>
  );
}
