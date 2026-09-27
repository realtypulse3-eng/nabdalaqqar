'use client';

import { useActionState } from '@/lib/hooks/use-action-state';
import { useI18n } from '@/lib/i18n/i18n-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/language-switcher';
import { updateProfile, updateOrganization, inviteTeammate } from '@/lib/actions/settings';
import type { FormActionState } from '@/lib/actions/leads';
import type { CurrentSession } from '@/lib/services/organizations';
import type { OrgRole } from '@/lib/supabase/types';

const initial: FormActionState = {};

const ROLE_LABEL_KEY: Record<OrgRole, string> = {
  owner: 'settings.roleOwner',
  admin: 'settings.roleAdmin',
  agent: 'settings.roleAgent',
  staff: 'settings.roleStaff',
};

const ROLE_DESC_KEY: Record<OrgRole, string> = {
  owner: 'settings.roleDescOwner',
  admin: 'settings.roleDescAdmin',
  agent: 'settings.roleDescAgent',
  staff: 'settings.roleDescStaff',
};

export function SettingsClient({
  session,
  team,
  aiConfigured,
}: {
  session: CurrentSession;
  team: { id: string; role: string; profiles: { id: string; full_name: string | null; email: string } }[];
  aiConfigured: boolean;
}) {
  const { t } = useI18n();
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, initial);
  const [orgState, orgAction, orgPending] = useActionState(updateOrganization, initial);
  const [inviteState, inviteAction, invitePending] = useActionState(inviteTeammate, initial);

  const canManageOrg = session.role === 'owner' || session.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold tracking-[-0.02em] text-ink">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('settings.subtitle')}</p>
      </div>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-ink">{t('settings.howAccessWorksTitle')}</h2>
        <p className="mb-4 text-sm text-ink-muted">{t('settings.howAccessWorksBody')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['owner', 'admin', 'agent', 'staff'] as OrgRole[]).map((r) => (
            <div key={r} className="rounded-control border border-white/[0.06] bg-surface-2 p-3">
              <Badge tone={r === 'owner' || r === 'admin' ? 'success' : r === 'agent' ? 'info' : 'neutral'}>
                {t(ROLE_LABEL_KEY[r])}
              </Badge>
              <p className="mt-2 text-xs text-ink-muted">{t(ROLE_DESC_KEY[r])}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-ink">{t('settings.profile')}</h2>
        <form onSubmit={(e) => { e.preventDefault(); profileAction(new FormData(e.currentTarget)); }} className="max-w-md space-y-4">
          <div>
            <Label>{t('auth.fullName')}</Label>
            <Input name="full_name" defaultValue={session.profile.full_name ?? ''} required />
          </div>
          <div>
            <Label>Timezone</Label>
            <Input name="timezone" defaultValue={session.profile.timezone} />
          </div>
          {profileState.error && <p className="text-sm text-danger">{profileState.error}</p>}
          {profileState.success && <p className="text-sm text-success">Saved.</p>}
          <Button type="submit" loading={profilePending}>
            {t('common.save')}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-ink">{t('settings.language')}</h2>
        <LanguageSwitcher />
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-ink">{t('settings.organization')}</h2>
        <form onSubmit={(e) => { e.preventDefault(); orgAction(new FormData(e.currentTarget)); }} className="max-w-md space-y-4">
          <div>
            <Label>{t('auth.organizationName')}</Label>
            <Input name="name" defaultValue={session.organizationName} disabled={!canManageOrg} required />
          </div>
          {orgState.error && <p className="text-sm text-danger">{orgState.error}</p>}
          {orgState.success && <p className="text-sm text-success">Saved.</p>}
          {canManageOrg && (
            <Button type="submit" loading={orgPending}>
              {t('common.save')}
            </Button>
          )}
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-ink">{t('settings.team')}</h2>
        <ul className="mb-6 divide-y divide-white/[0.04]">
          {team.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="text-ink">{m.profiles?.full_name || m.profiles?.email}</p>
                <p className="text-xs text-ink-faint">{m.profiles?.email}</p>
              </div>
              <Badge tone="neutral">{t(ROLE_LABEL_KEY[m.role as OrgRole])}</Badge>
            </li>
          ))}
        </ul>

        {canManageOrg && (
          <form onSubmit={(e) => { e.preventDefault(); inviteAction(new FormData(e.currentTarget)); }} className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <Label>{t('leads.email')}</Label>
              <Input type="email" name="email" required />
            </div>
            <div>
              <Label>{t('settings.role')}</Label>
              <Select name="role" defaultValue="agent">
                <option value="admin">{t(ROLE_LABEL_KEY.admin)}</option>
                <option value="agent">{t(ROLE_LABEL_KEY.agent)}</option>
                <option value="staff">{t(ROLE_LABEL_KEY.staff)}</option>
              </Select>
            </div>
            <Button type="submit" loading={invitePending}>
              {t('settings.inviteTeammate')}
            </Button>
          </form>
        )}
        {inviteState.error && <p className="mt-2 text-sm text-danger">{inviteState.error}</p>}
        {inviteState.success && <p className="mt-2 text-sm text-success">Invite sent.</p>}
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-ink">{t('settings.aiProviders')}</h2>
        {aiConfigured ? (
          <Badge tone="success">Connected</Badge>
        ) : (
          <p className="text-sm text-ink-muted">{t('settings.aiProviderNotConfigured')}</p>
        )}
      </Card>
    </div>
  );
}
