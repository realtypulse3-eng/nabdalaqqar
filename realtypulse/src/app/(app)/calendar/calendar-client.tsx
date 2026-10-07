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
import { createAppointment, deleteAppointment } from '@/lib/actions/appointments';
import type { FormActionState } from '@/lib/actions/leads';
import { can } from '@/lib/permissions';
import type { Appointment, Client, Property, OrgRole } from '@/lib/supabase/types';

const initial: FormActionState = {};

function AppointmentForm({ clients, properties, onDone }: { clients: Client[]; properties: Property[]; onDone: () => void }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(createAppointment, initial);

  if (state.success) onDone();

  return (
    <form onSubmit={(e) => { e.preventDefault(); formAction(new FormData(e.currentTarget)); }} className="space-y-4">
      <div>
        <Label>{t('calendar.startsAt')}</Label>
        <Input type="datetime-local" name="starts_at" required />
      </div>
      <div>
        <Label>{t('calendar.type')}</Label>
        <Input name="type" placeholder="viewing" defaultValue="viewing" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
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
      </div>
      <div>
        <Label>{t('leads.notes')}</Label>
        <Textarea name="notes" rows={2} />
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

export function CalendarClient({
  initialAppointments,
  clients,
  properties,
  role,
}: {
  initialAppointments: (Appointment & { clients?: { name: string } | null; properties?: { title: string } | null })[];
  clients: Client[];
  properties: Property[];
  role: OrgRole;
}) {
  const { t } = useI18n();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [modalOpen, setModalOpen] = useState(false);
  const canCreate = can(role, 'create');
  const canDelete = can(role, 'delete');

  async function handleDelete(id: string) {
    if (!confirm(t('common.confirmDeleteBody'))) return;
    await deleteAppointment(id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-[-0.02em] text-ink">{t('calendar.title')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('calendar.subtitle')}</p>
        </div>
        {canCreate && <Button onClick={() => setModalOpen(true)}>+ {t('calendar.addAppointment')}</Button>}
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          message={t('empty.appointments')}
          action={canCreate ? <Button onClick={() => setModalOpen(true)}>+ {t('calendar.addAppointment')}</Button> : undefined}
        />
      ) : (
        <Card className="divide-y divide-white/[0.04] p-0">
          {appointments.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  {[a.clients?.name, a.properties?.title].filter(Boolean).join(' · ') || a.type}
                </p>
                <p className="text-xs text-ink-faint">{new Date(a.starts_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={a.status === 'confirmed' ? 'success' : 'neutral'}>{a.status}</Badge>
                {canDelete && (
                  <button onClick={() => handleDelete(a.id)} className="text-xs text-danger hover:underline">
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('calendar.addAppointment')}>
        <AppointmentForm clients={clients} properties={properties} onDone={() => { setModalOpen(false); location.reload(); }} />
      </Modal>
    </div>
  );
}
