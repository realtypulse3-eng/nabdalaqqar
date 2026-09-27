'use client';

import { useActionState } from '@/lib/hooks/use-action-state';
import { useActionRedirect } from '@/lib/hooks/use-action-redirect';
import Link from 'next/link';
import { signup, type ActionState } from '@/lib/auth/actions';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/i18n-provider';

const initialState: ActionState = {};

export default function SignupPage() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(signup, initialState);
  useActionRedirect(state.redirectTo);

  return (
    <AuthShell title={t('auth.signupTitle')} subtitle={t('auth.signupSubtitle')}>
      {state?.success ? (
        <p className="rounded-control border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {state.success}
        </p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); formAction(new FormData(e.currentTarget)); }} className="space-y-4">
          <div>
            <Label>{t('auth.fullName')}</Label>
            <Input type="text" name="fullName" required autoComplete="name" />
          </div>
          <div>
            <Label>{t('auth.organizationName')}</Label>
            <Input type="text" name="organizationName" required />
          </div>
          <div>
            <Label>{t('auth.email')}</Label>
            <Input type="email" name="email" required autoComplete="email" />
          </div>
          <div>
            <Label>{t('auth.password')}</Label>
            <Input type="password" name="password" required autoComplete="new-password" minLength={8} />
          </div>
          <div>
            <Label>{t('auth.confirmPassword')}</Label>
            <Input type="password" name="confirmPassword" required autoComplete="new-password" minLength={8} />
          </div>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" className="w-full" loading={pending || !!state.redirectTo}>
            {pending || state.redirectTo ? t('auth.creatingAccount') : t('auth.createAccountCta')}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink-muted">
        {t('auth.haveAccount')}{' '}
        <Link href="/login" className="text-primary hover:underline">
          {t('auth.signIn')}
        </Link>
      </p>
    </AuthShell>
  );
}
