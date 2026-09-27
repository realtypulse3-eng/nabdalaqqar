'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { LOCALE_COOKIE, isLocale } from './config';

export async function setLocale(nextLocale: string) {
  if (!isLocale(nextLocale)) return;

  cookies().set(LOCALE_COOKIE, nextLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from('profiles').update({ language: nextLocale }).eq('id', user.id);
  }

  revalidatePath('/', 'layout');
}
