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
import { createClientContact, updateClientContact, deleteClientContact } from '@/lib/actions/clients';
import type { FormActionState } from '@/lib/actions/leads';
import { can } from '@/lib/permissions';
import type { Client, ClientStatus, OrgRole } from '@/lib/supabase/types';

const STATUS_TONE: Record<ClientStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  past: 'neutral',
  prospect: 'info',
};

const initial: FormActionState = {};

function ContactForm({ client, onDone }: { client?: Client; onDone: () => void }) {
  const { t } = useI18n();
  const action = client ? updateClientContact.bind(null, client.id) : createClientContact;
  const [state, formAction, pending] = useActionState(action, initial);

  if (state.success) onDone();

  return (
    <form onSubmit={(e) => { e.preventDefault(); formAction(new FormData(e.currentTarget)); }} className="space-y-4">
      <div>
        <Label>{t('leads.name')}</Label>
        <Input name="name" defaultValue={client?.name} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('leads.email')}</Label>
          <Input type="email" name="email" defaultValue={client?.email ?? ''} />
        </div>
        <div>
          <Label>{t('leads.phone')}</Label>
          <Input name="phone" defaultValue={client?.phone ?? ''} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('common.status')}</Label>
          <Select name="status" defaultValue={client?.status ?? 'prospect'}>
            {['active', 'past', 'prospect'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t('contacts.tags')}</Label>
          <Input name="tags" placeholder="vip, investor" defaultValue={client?.tags?.join(', ') ?? ''} />
        </div>
      </div>
      <div>
        <Label>{t('leads.notes')}</Label>
        <Textarea name="notes" rows={3} defaultValue={client?.notes ?? ''} />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={pending}>
          {client ? t('common.update') : t('common.create')}
        </Button>
      </div>
    </form>
  );
}

export function ContactsClient({ initialClients, role }: { initialClients: Client[]; role: OrgRole }) {
  const { t } = useI18n();
  const [clients, setClients] = useState(initialClients);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | undefined>();
  const canCreate = can(role, 'create');
  const canEdit = can(role, 'edit');
  const canDelete = can(role, 'delete');

  function openCreate() {
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(c: Client) {
    setEditing(c);
    setModalOpen(true);
  }
  async function handleDelete(id: string) {
    if (!confirm(t('common.confirmDeleteBody'))) return;
    await deleteClientContact(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-[-0.02em] text-ink">{t('contacts.title')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('contacts.subtitle')}</p>
        </div>
        {canCreate && <Button onClick={openCreate}>+ {t('contacts.addContact')}</Button>}
      </div>

      {clients.length === 0 ? (
        <EmptyState
          message={t('empty.contacts')}
          action={canCreate ? <Button onClick={openCreate}>+ {t('contacts.addContact')}</Button> : undefined}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 text-start">{t('leads.name')}</th>
                <th className="px-4 py-3 text-start">{t('common.status')}</th>
                <th className="px-4 py-3 text-start">{t('contacts.tags')}</th>
                <th className="px-4 py-3 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.04] last:border-0 hover:bg-surface-2/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{c.name}</p>
                    <p className="text-xs text-ink-faint">{c.email || c.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{c.tags?.join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 text-xs">
                      {canEdit && (
                        <button onClick={() => openEdit(c)} className="text-ink-muted hover:text-ink">
                          {t('common.edit')}
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(c.id)} className="text-danger hover:underline">
                          {t('common.delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('contacts.editContact') : t('contacts.addContact')}>
        <ContactForm
          client={editing}
          onDone={() => {
            setModalOpen(false);
            location.reload();
          }}
        />
      </Modal>
    </div>
  );
}
