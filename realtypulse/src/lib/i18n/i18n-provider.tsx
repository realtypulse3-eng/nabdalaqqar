'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { directionFor, type Locale } from './config';
import type { Dictionary } from './get-dictionary';

interface I18nContextValue {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  dict: Dictionary;
  t: (path: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolve(dict: Dictionary, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
  return typeof value === 'string' ? value : path;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    template
  );
}

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => interpolate(resolve(dict, path), vars),
    [dict]
  );

  const value = useMemo(
    () => ({ locale, dir: directionFor(locale), dict, t }),
    [locale, dict, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
