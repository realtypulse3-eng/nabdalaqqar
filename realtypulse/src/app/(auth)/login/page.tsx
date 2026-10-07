'use client';

import { useActionState } from '@/lib/hooks/use-action-state';
import { useActionRedirect } from '@/lib/hooks/use-action-redirect';
import Link from 'next/link';
import { login, type ActionState } from '@/lib/auth/actions';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/i18n-provider';

const initialState: ActionState = {};

export default function LoginPage() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(login, initialState);
  useActionRedirect(state.redirectTo);

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={(e) => { e.preventDefault(); formAction(new FormData(e.currentTarget)); }} className="space-y-4">
        <div>
          <Label>{t('auth.email')}</Label>
          <Input type="email" name="email" required autoComplete="email" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>{t('auth.password')}</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <Input type="password" name="password" required autoComplete="current-password" />
        </div>
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" className="w-full" loading={pending || !!state.redirectTo}>
          {pending || state.redirectTo ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-muted">
        {t('auth.noAccount')}{' '}
        <Link href="/signup" className="text-primary hover:underline">
          {t('auth.createAccount')}
        </Link>
      </p>
    </AuthShell>
  );
}
