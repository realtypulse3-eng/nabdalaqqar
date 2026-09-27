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
import { createProperty, updateProperty, deleteProperty } from '@/lib/actions/properties';
import type { FormActionState } from '@/lib/actions/leads';
import { can } from '@/lib/permissions';
import type { Property, PropertyStatus, OrgRole } from '@/lib/supabase/types';

const STATUS_TONE: Record<PropertyStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'neutral',
  active: 'success',
  under_offer: 'warning',
  sold: 'info',
  rented: 'info',
  off_market: 'danger',
};

const initial: FormActionState = {};

function PropertyForm({ property, onDone }: { property?: Property; onDone: () => void }) {
  const { t } = useI18n();
  const action = property ? updateProperty.bind(null, property.id) : createProperty;
  const [state, formAction, pending] = useActionState(action, initial);

  if (state.success) onDone();

  return (
    <form onSubmit={(e) => { e.preventDefault(); formAction(new FormData(e.currentTarget)); }} className="space-y-4">
      <div>
        <Label>{t('properties.titleField')}</Label>
        <Input name="title" defaultValue={property?.title} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('properties.address')}</Label>
          <Input name="address" defaultValue={property?.address ?? ''} />
        </div>
        <div>
          <Label>{t('properties.city')}</Label>
          <Input name="city" defaultValue={property?.city ?? ''} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('properties.price')}</Label>
          <Input type="number" name="price" defaultValue={property?.price ?? ''} />
        </div>
        <div>
          <Label>{t('properties.type')}</Label>
          <Select name="property_type" defaultValue={property?.property_type ?? 'apartment'}>
            {['apartment', 'villa', 'townhouse', 'penthouse', 'office', 'retail', 'land', 'other'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>{t('properties.status')}</Label>
          <Select name="status" defaultValue={property?.status ?? 'draft'}>
            {['draft', 'active', 'under_offer', 'sold', 'rented', 'off_market'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t('properties.bedrooms')}</Label>
          <Input type="number" name="bedrooms" defaultValue={property?.bedrooms ?? ''} />
        </div>
        <div>
          <Label>{t('properties.bathrooms')}</Label>
          <Input type="number" name="bathrooms" defaultValue={property?.bathrooms ?? ''} />
        </div>
      </div>
      <div>
        <Label>{t('properties.area')}</Label>
        <Input type="number" name="area_sqft" defaultValue={property?.area_sqft ?? ''} />
      </div>
      <div>
        <Label>{t('properties.description')}</Label>
        <Textarea name="description" rows={3} defaultValue={property?.description ?? ''} />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={pending}>
          {property ? t('common.update') : t('common.create')}
        </Button>
      </div>
    </form>
  );
}

export function PropertiesClient({ initialProperties, role }: { initialProperties: Property[]; role: OrgRole }) {
  const { t } = useI18n();
  const [properties, setProperties] = useState(initialProperties);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Property | undefined>();
  const canCreate = can(role, 'create');
  const canEdit = can(role, 'edit');
  const canDelete = can(role, 'delete');

  function openCreate() {
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(p: Property) {
    setEditing(p);
    setModalOpen(true);
  }
  async function handleDelete(id: string) {
    if (!confirm(t('common.confirmDeleteBody'))) return;
    await deleteProperty(id);
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-[-0.02em] text-ink">{t('properties.title')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('properties.subtitle')}</p>
        </div>
        {canCreate && <Button onClick={openCreate}>+ {t('properties.addProperty')}</Button>}
      </div>

      {properties.length === 0 ? (
        <EmptyState
          message={t('empty.properties')}
          action={canCreate ? <Button onClick={openCreate}>+ {t('properties.addProperty')}</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-ink">{p.title}</p>
                  <p className="text-xs text-ink-faint">{[p.address, p.city].filter(Boolean).join(', ') || '—'}</p>
                </div>
                <Badge tone={STATUS_TONE[p.status]}>{p.status.replace('_', ' ')}</Badge>
              </div>
              <p className="tabular-nums text-lg font-semibold text-ink">
                {p.price ? p.price.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '—'}
              </p>
              <div className="flex gap-3 text-xs text-ink-muted">
                <span>{p.bedrooms ?? '—'} bd</span>
                <span>{p.bathrooms ?? '—'} ba</span>
                <span>{p.area_sqft ? `${p.area_sqft.toLocaleString()} sqft` : '—'}</span>
              </div>
              <div className="mt-auto flex justify-end gap-3 pt-2 text-xs">
                {canEdit && (
                  <button onClick={() => openEdit(p)} className="text-ink-muted hover:text-ink">
                    {t('common.edit')}
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(p.id)} className="text-danger hover:underline">
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('properties.editProperty') : t('properties.addProperty')}>
        <PropertyForm
          property={editing}
          onDone={() => {
            setModalOpen(false);
            location.reload();
          }}
        />
      </Modal>
    </div>
  );
}
