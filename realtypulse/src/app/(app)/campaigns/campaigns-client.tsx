'use client';

import { useState } from 'react';
import { useActionState } from '@/lib/hooks/use-action-state';
import { useI18n } from '@/lib/i18n/i18n-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input, Label, Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/states';
import { createCampaign, deleteCampaign } from '@/lib/actions/campaigns';
import type { FormActionState } from '@/lib/actions/leads';
import { can } from '@/lib/permissions';
import type { Campaign, CampaignStatus, OrgRole } from '@/lib/supabase/types';

const STATUS_TONE: Record<CampaignStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'neutral',
  active: 'success',
  paused: 'warning',
  completed: 'info',
};

const initial: FormActionState = {};

function CampaignForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(createCampaign, initial);

  if (state.success) onDone();

  return (
    <form onSubmit={(e) => { e.preventDefault(); formAction(new FormData(e.currentTarget)); }} className="space-y-4">
      <div>
        <Label>{t('leads.name')}</Label>
        <Input name="name" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('campaigns.channel')}</Label>
          <Select name="channel" defaultValue="email">
            {['email', 'whatsapp', 'sms', 'social', 'ads', 'other'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t('common.status')}</Label>
          <Select name="status" defaultValue="draft">
            {['draft', 'active', 'paused', 'completed'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label>{t('campaigns.budget')}</Label>
        <Input type="number" name="budget" />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={pending}>
          {t('common.create')}
        </Button>
      </div>
    </form>
  );
}

export function CampaignsClient({ initialCampaigns, role }: { initialCampaigns: Campaign[]; role: OrgRole }) {
  const { t } = useI18n();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [modalOpen, setModalOpen] = useState(false);
  const canCreate = can(role, 'create');
  const canDelete = can(role, 'delete');

  async function handleDelete(id: string) {
    if (!confirm(t('common.confirmDeleteBody'))) return;
    await deleteCampaign(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-[-0.02em] text-ink">{t('campaigns.title')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('campaigns.subtitle')}</p>
        </div>
        {canCreate && <Button onClick={() => setModalOpen(true)}>+ {t('campaigns.addCampaign')}</Button>}
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          message={t('empty.campaigns')}
          action={canCreate ? <Button onClick={() => setModalOpen(true)}>+ {t('campaigns.addCampaign')}</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <p className="font-medium text-ink">{c.name}</p>
                <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-ink-muted">
                <div>
                  <p className="text-ink-faint">{t('campaigns.channel')}</p>
                  <p className="text-ink">{c.channel}</p>
                </div>
                <div>
                  <p className="text-ink-faint">{t('campaigns.budget')}</p>
                  <p className="tabular-nums text-ink">{c.budget ? `$${c.budget.toLocaleString()}` : '—'}</p>
                </div>
                <div>
                  <p className="text-ink-faint">{t('campaigns.leadsGenerated')}</p>
                  <p className="tabular-nums text-ink">{c.leads_generated}</p>
                </div>
              </div>
              <div className="flex justify-end pt-1 text-xs">
                {canDelete && (
                  <button onClick={() => handleDelete(c.id)} className="text-danger hover:underline">
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('campaigns.addCampaign')}>
        <CampaignForm onDone={() => { setModalOpen(false); location.reload(); }} />
      </Modal>
    </div>
  );
}
