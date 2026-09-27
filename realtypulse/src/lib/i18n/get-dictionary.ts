import { cookies } from 'next/headers';
import 'server-only';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config';
import en from './locales/en.json';
import ar from './locales/ar.json';

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, ar: ar as Dictionary };

export function getLocale(): Locale {
  const cookieValue = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;
}

export function getDictionary(locale?: Locale): Dictionary {
  return dictionaries[locale ?? getLocale()];
}
