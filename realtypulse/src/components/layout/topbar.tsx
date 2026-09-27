'use client';

import { useState } from 'react';
import { logout } from '@/lib/auth/actions';
import { useI18n } from '@/lib/i18n/i18n-provider';
import { LanguageSwitcher } from '@/components/language-switcher';
import type { NotificationRow } from '@/lib/supabase/types';

export function Topbar({
  userName,
  notifications,
}: {
  userName: string;
  notifications: NotificationRow[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/[0.06] bg-canvas/75 px-4 py-3 backdrop-blur-topbar md:px-6">
      <div className="flex flex-1 items-center gap-2 rounded-control border border-border-strong bg-surface px-3 py-2 text-sm text-ink-faint">
        <span>⌕</span>
        <span className="truncate">{t('common.search')}</span>
      </div>

      <LanguageSwitcher />

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative flex h-9 w-9 items-center justify-center rounded-control border border-border-strong bg-surface text-ink-muted hover:text-ink"
          aria-label={t('common.notifications')}
        >
          🔔
          {unread > 0 && (
            <span className="absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute end-0 mt-2 w-80 rounded-modal border border-white/10 bg-surface-2 p-2 shadow-2xl">
            <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {t('common.notifications')}
            </p>
            {notifications.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-ink-muted">{t('common.noNotifications')}</p>
            ) : (
              <ul className="max-h-80 space-y-1 overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id} className="rounded-control px-2 py-2 text-sm hover:bg-surface">
                    <p className="font-medium text-ink">{n.title}</p>
                    {n.message && <p className="text-xs text-ink-muted">{n.message}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-s border-border-strong ps-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink">
          {userName?.[0]?.toUpperCase() ?? '?'}
        </div>
        <form action={logout}>
          <button type="submit" className="text-xs text-ink-muted hover:text-ink">
            {t('common.signOut')}
          </button>
        </form>
      </div>
    </header>
  );
}
