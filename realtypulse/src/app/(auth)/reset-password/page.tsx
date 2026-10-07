'use client';

import { useActionState } from '@/lib/hooks/use-action-state';
import { useActionRedirect } from '@/lib/hooks/use-action-redirect';
import { resetPassword, type ActionState } from '@/lib/auth/actions';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/i18n-provider';

const initialState: ActionState = {};

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(resetPassword, initialState);
  useActionRedirect(state.redirectTo);

  return (
    <AuthShell title={t('auth.resetTitle')} subtitle="">
      <form onSubmit={(e) => { e.preventDefault(); formAction(new FormData(e.currentTarget)); }} className="space-y-4">
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
          {t('auth.resetCta')}
        </Button>
      </form>
    </AuthShell>
  );
}
