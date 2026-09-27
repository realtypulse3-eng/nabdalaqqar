'use client';

import { useState } from 'react';
import { useActionState } from '@/lib/hooks/use-action-state';
import { useI18n } from '@/lib/i18n/i18n-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input, Label, Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/states';
import { createDeal, updateDealStatus, deleteDeal } from '@/lib/actions/deals';
import type { FormActionState } from '@/lib/actions/leads';
import { can } from '@/lib/permissions';
import type { Deal, DealStatus, Property, Client, OrgRole } from '@/lib/supabase/types';

const STAGES: DealStatus[] = ['open', 'negotiation', 'under_contract', 'closed_won', 'closed_lost'];

const STAGE_LABEL_KEY: Record<DealStatus, string> = {
  open: 'deals.stageOpen',
  negotiation: 'deals.stageNegotiation',
  under_contract: 'deals.stageUnderContract',
  closed_won: 'deals.stageClosedWon',
  closed_lost: 'deals.stageClosedLost',
};

const initial: FormActionState = {};

function DealForm({ properties, clients, onDone }: { properties: Property[]; clients: Client[]; onDone: () => void }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(createDeal, initial);

  if (state.success) onDone();

  return (
    <form onSubmit={(e) => { e.preventDefault(); formAction(new FormData(e.currentTarget)); }} className="space-y-4">
      <div>
        <Label>{t('deals.title')}</Label>
        <Input name="title" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('deals.value')}</Label>
          <Input type="number" name="value" required />
        </div>
        <div>
          <Label>{t('deals.probability')} (%)</Label>
          <Input type="number" name="probability" min={0} max={100} defaultValue={50} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('common.status')}</Label>
          <Select name="status" defaultValue="open">
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t('deals.closingDate')}</Label>
          <Input type="date" name="closing_date" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('properties.title')}</Label>
          <Select name="property_id" defaultValue="">
            <option value="">—</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t('contacts.title')}</Label>
          <Select name="client_id" defaultValue="">
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
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

export function DealsClient({
  initialDeals,
  properties,
  clients,
  role,
}: {
  initialDeals: (Deal & { properties?: { title: string } | null; clients?: { name: string } | null })[];
  properties: Property[];
  clients: Client[];
  role: OrgRole;
}) {
  const { t } = useI18n();
  const [deals, setDeals] = useState(initialDeals);
  const [modalOpen, setModalOpen] = useState(false);
  const canCreate = can(role, 'create');
  const canEdit = can(role, 'edit');
  const canDelete = can(role, 'delete');

  async function handleDelete(id: string) {
    if (!confirm(t('common.confirmDeleteBody'))) return;
    await deleteDeal(id);
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleStageChange(id: string, status: DealStatus) {
    await updateDealStatus(id, status);
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-[-0.02em] text-ink">{t('deals.title')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('deals.subtitle')}</p>
        </div>
        {canCreate && <Button onClick={() => setModalOpen(true)}>+ {t('deals.addDeal')}</Button>}
      </div>

      {deals.length === 0 ? (
        <EmptyState
          message={t('empty.deals')}
          action={canCreate ? <Button onClick={() => setModalOpen(true)}>+ {t('deals.addDeal')}</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.status === stage);
            const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);
            return (
              <div key={stage} className="min-w-[220px]">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{t(STAGE_LABEL_KEY[stage])}</p>
                  <span className="text-xs text-ink-faint">{stageDeals.length}</span>
                </div>
                <p className="mb-2 px-1 text-xs tabular-nums text-ink-muted">
                  {stageTotal.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                </p>
                <div className="space-y-2">
                  {stageDeals.map((deal) => (
                    <Card key={deal.id} className="space-y-2">
                      <p className="text-sm font-medium text-ink">{deal.title}</p>
                      <p className="tabular-nums text-sm text-ink-muted">
                        {Number(deal.value).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                      </p>
                      {(deal.properties?.title || deal.clients?.name) && (
                        <p className="text-xs text-ink-faint">
                          {[deal.properties?.title, deal.clients?.name].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <Select
                          value={deal.status}
                          onChange={(e) => handleStageChange(deal.id, e.target.value as DealStatus)}
                          disabled={!canEdit}
                          className="!py-1 text-xs"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace('_', ' ')}
                            </option>
                          ))}
                        </Select>
                        {canDelete && (
                          <button onClick={() => handleDelete(deal.id)} className="ms-2 text-xs text-danger hover:underline">
                            {t('common.delete')}
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('deals.addDeal')}>
        <DealForm properties={properties} clients={clients} onDone={() => { setModalOpen(false); location.reload(); }} />
      </Modal>
    </div>
  );
}
