'use client';

import { useTransition } from 'react';
import { setLocale } from '@/lib/i18n/actions';
import { useI18n } from '@/lib/i18n/i18n-provider';

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const [isPending, startTransition] = useTransition();

  function handleSwitch(next: 'en' | 'ar') {
    if (next === locale || isPending) return;
    startTransition(() => {
      setLocale(next);
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border-strong bg-surface-2 p-0.5 text-xs">
      <button
        type="button"
        onClick={() => handleSwitch('en')}
        aria-pressed={locale === 'en'}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === 'en' ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'
        }`}
      >
        {t('common.english')}
      </button>
      <button
        type="button"
        onClick={() => handleSwitch('ar')}
        aria-pressed={locale === 'ar'}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === 'ar' ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'
        }`}
      >
        {t('common.arabic')}
      </button>
    </div>
  );
}
