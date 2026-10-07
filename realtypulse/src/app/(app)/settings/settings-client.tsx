'use client';

import { useActionState } from '@/lib/hooks/use-action-state';
import { useI18n } from '@/lib/i18n/i18n-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  updateProfile,
  updateOrganization,
  inviteTeammate,
  uploadOrganizationLogo,
  removeOrganizationLogo,
} from '@/lib/actions/settings';
import {
  saveWhatsAppIntegration,
  disconnectWhatsAppIntegration,
  saveEmailIntegration,
  disconnectEmailIntegration,
} from '@/lib/actions/integrations';
import { useRef } from 'react';
import type { FormActionState } from '@/lib/actions/leads';
import type { CurrentSession } from '@/lib/services/organizations';
import type { OrgRole } from '@/lib/supabase/types';
import type { IntegrationsStatus } from '@/lib/services/integrations';

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
  integrations,
}: {
  session: CurrentSession;
  team: { id: string; role: string; profiles: { id: string; full_name: string | null; email: string } }[];
  aiConfigured: boolean;
  integrations: IntegrationsStatus | null;
}) {
  const { t } = useI18n();
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, initial);
  const [orgState, orgAction, orgPending] = useActionState(updateOrganization, initial);
  const [inviteState, inviteAction, invitePending] = useActionState(inviteTeammate, initial);
  const [waState, waAction, waPending] = useActionState(saveWhatsAppIntegration, initial);
  const [waDisconnectState, waDisconnectAction, waDisconnectPending] = useActionState(disconnectWhatsAppIntegration, initial);
  const [emailState, emailAction, emailPending] = useActionState(saveEmailIntegration, initial);
  const [emailDisconnectState, emailDisconnectAction, emailDisconnectPending] = useActionState(disconnectEmailIntegration, initial);
  const [logoState, logoAction, logoPending] = useActionState(uploadOrganizationLogo, initial);
  const [logoRemoveState, logoRemoveAction, logoRemovePending] = useActionState(removeOrganizationLogo, initial);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

      {canManageOrg && (
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-ink">{t('settings.branding')}</h2>
          <p className="mb-4 text-sm text-ink-muted">{t('settings.brandingSubtitle')}</p>

          <div className="flex items-center gap-4">
            {session.organizationLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.organizationLogoUrl}
                alt={session.organizationName}
                className="h-16 w-16 rounded-control border border-white/[0.06] bg-surface-2 object-contain p-1"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-control border border-dashed border-border-strong text-xs text-ink-faint">
                {t('settings.logo')}
              </div>
            )}

            <div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  logoAction(new FormData(e.currentTarget));
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={logoInputRef}
                  type="file"
                  name="logo"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    if (e.currentTarget.form) logoAction(new FormData(e.currentTarget.form));
                  }}
                />
                <Button type="button" variant="secondary" onClick={() => logoInputRef.current?.click()} loading={logoPending}>
                  {session.organizationLogoUrl ? t('settings.changeLogo') : t('settings.uploadLogo')}
                </Button>
                {session.organizationLogoUrl && (
                  <Button
                    type="button"
                    variant="danger"
                    loading={logoRemovePending}
                    onClick={() => logoRemoveAction(new FormData())}
                  >
                    {t('settings.removeLogo')}
                  </Button>
                )}
              </form>
              <p className="mt-2 text-xs text-ink-faint">{t('settings.logoHint')}</p>
              {logoState.error && <p className="mt-2 text-sm text-danger">{logoState.error}</p>}
              {logoRemoveState.error && <p className="mt-2 text-sm text-danger">{logoRemoveState.error}</p>}
            </div>
          </div>
        </Card>
      )}

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

      {canManageOrg && integrations && (
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-ink">{t('settings.integrations')}</h2>
          <p className="mb-4 text-sm text-ink-muted">{t('settings.integrationsSubtitle')}</p>

          <div className="space-y-6 divide-y divide-white/[0.04]">
            {/* WhatsApp */}
            <div className={integrations.email.connected || integrations.whatsapp.connected ? 'pt-6 first:pt-0' : ''}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-ink">{t('settings.whatsappTitle')}</h3>
                <Badge tone={integrations.whatsapp.connected ? 'success' : 'neutral'}>
                  {integrations.whatsapp.connected ? t('settings.connected') : t('settings.notConnected')}
                </Badge>
              </div>
              <p className="mb-4 text-xs text-ink-muted">{t('settings.whatsappDesc')}</p>

              {integrations.whatsapp.connected ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-ink-muted">
                    {t('settings.phoneNumberId')}: <span className="text-ink">{integrations.whatsapp.phoneNumberId}</span>
                  </span>
                  <span className="text-ink-muted">
                    {t('settings.accessToken')}: <span className="text-ink">{integrations.whatsapp.tokenMasked}</span>
                  </span>
                  <form onSubmit={(e) => { e.preventDefault(); waDisconnectAction(new FormData()); }}>
                    <Button type="submit" variant="danger" loading={waDisconnectPending}>
                      {t('settings.disconnect')}
                    </Button>
                  </form>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); waAction(new FormData(e.currentTarget)); }} className="max-w-md space-y-4">
                  <div>
                    <Label>{t('settings.phoneNumberId')}</Label>
                    <Input name="whatsapp_phone_number_id" required />
                  </div>
                  <div>
                    <Label>{t('settings.accessToken')}</Label>
                    <Input name="whatsapp_access_token" type="password" required />
                  </div>
                  <Button type="submit" loading={waPending}>
                    {t('settings.connect')}
                  </Button>
                </form>
              )}
              {waState.error && <p className="mt-2 text-sm text-danger">{waState.error}</p>}
              {waDisconnectState.error && <p className="mt-2 text-sm text-danger">{waDisconnectState.error}</p>}
            </div>

            {/* Email */}
            <div className="pt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-ink">{t('settings.emailTitle')}</h3>
                <Badge tone={integrations.email.connected ? 'success' : 'neutral'}>
                  {integrations.email.connected ? t('settings.connected') : t('settings.notConnected')}
                </Badge>
              </div>
              <p className="mb-4 text-xs text-ink-muted">{t('settings.emailDesc')}</p>

              {integrations.email.connected ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-ink-muted">
                    {t('settings.fromAddress')}: <span className="text-ink">{integrations.email.fromAddress}</span>
                  </span>
                  <span className="text-ink-muted">
                    {t('settings.apiKey')}: <span className="text-ink">{integrations.email.keyMasked}</span>
                  </span>
                  <form onSubmit={(e) => { e.preventDefault(); emailDisconnectAction(new FormData()); }}>
                    <Button type="submit" variant="danger" loading={emailDisconnectPending}>
                      {t('settings.disconnect')}
                    </Button>
                  </form>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); emailAction(new FormData(e.currentTarget)); }} className="max-w-md space-y-4">
                  <div>
                    <Label>{t('settings.fromAddress')}</Label>
                    <Input name="email_from_address" type="email" placeholder="hello@youragency.com" required />
                  </div>
                  <div>
                    <Label>{t('settings.apiKey')}</Label>
                    <Input name="email_api_key" type="password" required />
                    <input type="hidden" name="email_provider" value="resend" />
                  </div>
                  <Button type="submit" loading={emailPending}>
                    {t('settings.connect')}
                  </Button>
                </form>
              )}
              {emailState.error && <p className="mt-2 text-sm text-danger">{emailState.error}</p>}
              {emailDisconnectState.error && <p className="mt-2 text-sm text-danger">{emailDisconnectState.error}</p>}
            </div>
          </div>
        </Card>
      )}

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
