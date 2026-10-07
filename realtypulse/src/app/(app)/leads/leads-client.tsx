'use client';

import { useState } from 'react';
import { useActionState } from '@/lib/hooks/use-action-state';
import { useI18n } from '@/lib/i18n/i18n-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/states';
import { createLead, updateLead, deleteLead, convertLeadToClient, type FormActionState } from '@/lib/actions/leads';
import { can } from '@/lib/permissions';
import type { Lead, LeadStatus, OrgRole } from '@/lib/supabase/types';

const STATUS_TONE: Record<LeadStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  new: 'info',
  contacted: 'neutral',
  qualified: 'success',
  nurturing: 'warning',
  converted: 'success',
  lost: 'danger',
};

const initial: FormActionState = {};

function LeadForm({ lead, onDone }: { lead?: Lead; onDone: () => void }) {
  const { t } = useI18n();
  const action = lead ? updateLead.bind(null, lead.id) : createLead;
  const [state, formAction, pending] = useActionState(action, initial);

  if (state.success) onDone();

  return (
    <form onSubmit={(e) => { e.preventDefault(); formAction(new FormData(e.currentTarget)); }} className="space-y-4">
      <div>
        <Label>{t('leads.name')}</Label>
        <Input name="name" defaultValue={lead?.name} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('leads.email')}</Label>
          <Input type="email" name="email" defaultValue={lead?.email ?? ''} />
        </div>
        <div>
          <Label>{t('leads.phone')}</Label>
          <Input name="phone" defaultValue={lead?.phone ?? ''} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('leads.status')}</Label>
          <Select name="status" defaultValue={lead?.status ?? 'new'}>
            {['new', 'contacted', 'qualified', 'nurturing', 'converted', 'lost'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t('leads.source')}</Label>
          <Select name="source" defaultValue={lead?.source ?? 'website'}>
            {['website', 'referral', 'campaign', 'walk_in', 'portal', 'whatsapp', 'other'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('leads.budget')} (min)</Label>
          <Input type="number" name="budget_min" defaultValue={lead?.budget_min ?? ''} />
        </div>
        <div>
          <Label>{t('leads.budget')} (max)</Label>
          <Input type="number" name="budget_max" defaultValue={lead?.budget_max ?? ''} />
        </div>
      </div>
      <div>
        <Label>{t('leads.interest')}</Label>
        <Input name="interest" defaultValue={lead?.interest ?? ''} />
      </div>
      <div>
        <Label>{t('leads.notes')}</Label>
        <Textarea name="notes" rows={3} defaultValue={lead?.notes ?? ''} />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={pending}>
          {lead ? t('common.update') : t('common.create')}
        </Button>
      </div>
    </form>
  );
}

export function LeadsClient({ initialLeads, role }: { initialLeads: Lead[]; role: OrgRole }) {
  const { t } = useI18n();
  const [leads, setLeads] = useState(initialLeads);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | undefined>();
  const canCreate = can(role, 'create');
  const canEdit = can(role, 'edit');
  const canDelete = can(role, 'delete');

  function openCreate() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditing(lead);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm(t('common.confirmDeleteBody'))) return;
    await deleteLead(id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleConvert(id: string) {
    await convertLeadToClient(id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'converted' } : l)));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-[-0.02em] text-ink">{t('leads.title')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('leads.subtitle')}</p>
        </div>
        {canCreate && <Button onClick={openCreate}>+ {t('leads.addLead')}</Button>}
      </div>

      {leads.length === 0 ? (
        <EmptyState
          message={t('empty.leads')}
          action={canCreate ? <Button onClick={openCreate}>+ {t('leads.addLead')}</Button> : undefined}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-start text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-start text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 text-start">{t('leads.name')}</th>
                <th className="px-4 py-3 text-start">{t('leads.source')}</th>
                <th className="px-4 py-3 text-start">{t('leads.status')}</th>
                <th className="px-4 py-3 text-start">{t('leads.budget')}</th>
                <th className="px-4 py-3 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-white/[0.04] last:border-0 hover:bg-surface-2/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{lead.name}</p>
                    <p className="text-xs text-ink-faint">{lead.email || lead.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{lead.source}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[lead.status]}>{lead.status}</Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink-muted">
                    {lead.budget_min || lead.budget_max
                      ? `${lead.budget_min?.toLocaleString() ?? '?'} – ${lead.budget_max?.toLocaleString() ?? '?'}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 text-xs">
                      {canEdit && lead.status !== 'converted' && (
                        <button onClick={() => handleConvert(lead.id)} className="text-cyan hover:underline">
                          {t('leads.convertToClient')}
                        </button>
                      )}
                      {canEdit && (
                        <button onClick={() => openEdit(lead)} className="text-ink-muted hover:text-ink">
                          {t('common.edit')}
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(lead.id)} className="text-danger hover:underline">
                          {t('common.delete')}
                        </button>
                      )}
                      {!canEdit && !canDelete && <span className="text-ink-faint">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('leads.editLead') : t('leads.addLead')}>
        <LeadForm
          lead={editing}
          onDone={() => {
            setModalOpen(false);
            location.reload();
          }}
        />
      </Modal>
    </div>
  );
}
