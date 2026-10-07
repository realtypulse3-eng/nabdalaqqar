'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useI18n } from '@/lib/i18n/i18n-provider';

const NAV_ITEMS = [
  { href: '/dashboard', key: 'nav.dashboard', icon: '▦' },
  { href: '/ai-agents', key: 'nav.aiAgents', icon: '✦' },
  { href: '/leads', key: 'nav.leads', icon: '◎' },
  { href: '/properties', key: 'nav.properties', icon: '⌂' },
  { href: '/contacts', key: 'nav.contacts', icon: '☺' },
  { href: '/deals', key: 'nav.deals', icon: '◆' },
  { href: '/campaigns', key: 'nav.campaigns', icon: '▲' },
  { href: '/communications', key: 'nav.communications', icon: '✉' },
  { href: '/calendar', key: 'nav.calendar', icon: '▤' },
  { href: '/analytics', key: 'nav.analytics', icon: '▥' },
  { href: '/settings', key: 'nav.settings', icon: '⚙' },
] as const;

export function Sidebar({
  organizationName,
  organizationLogoUrl,
}: {
  organizationName: string;
  organizationLogoUrl?: string | null;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const initial = organizationName?.trim()?.[0]?.toUpperCase() || 'R';

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-e border-white/[0.06] bg-surface px-3 py-5 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        {organizationLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={organizationLogoUrl}
            alt={organizationName || t('common.appName')}
            className="h-8 w-8 shrink-0 rounded-control object-contain"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-gradient-to-br from-primary to-cyan text-sm font-bold text-white">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{organizationName || t('common.appName')}</p>
          <p className="truncate text-[11px] text-ink-faint">{t('common.poweredBy')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors',
                active ? 'bg-primary/15 text-ink border border-primary/30' : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
              )}
            >
              <span className="w-4 text-center opacity-80">{item.icon}</span>
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
