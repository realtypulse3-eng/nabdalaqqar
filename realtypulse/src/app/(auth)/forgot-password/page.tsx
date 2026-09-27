'use client';

import { useActionState } from '@/lib/hooks/use-action-state';
import Link from 'next/link';
import { requestPasswordReset, type ActionState } from '@/lib/auth/actions';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/i18n-provider';

const initialState: ActionState = {};

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <AuthShell title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
      {state?.success ? (
        <p className="rounded-control border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {state.success}
        </p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); formAction(new FormData(e.currentTarget)); }} className="space-y-4">
          <div>
            <Label>{t('auth.email')}</Label>
            <Input type="email" name="email" required autoComplete="email" />
          </div>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" className="w-full" loading={pending}>
            {t('auth.sendResetLink')}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link href="/login" className="text-primary hover:underline">
          {t('auth.signIn')}
        </Link>
      </p>
    </AuthShell>
  );
}
