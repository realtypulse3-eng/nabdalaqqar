'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentSession } from '@/lib/services/organizations';
import type { FormActionState } from './leads';

const propertySchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  price: z.string().optional().or(z.literal('')),
  property_type: z.enum(['apartment', 'villa', 'townhouse', 'penthouse', 'office', 'retail', 'land', 'other']),
  status: z.enum(['draft', 'active', 'under_offer', 'sold', 'rented', 'off_market']),
  bedrooms: z.string().optional().or(z.literal('')),
  bathrooms: z.string().optional().or(z.literal('')),
  area_sqft: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

function num(v: string | undefined) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function createProperty(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const parsed = propertySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const { error } = await supabase.from('properties').insert({
    organization_id: session.organizationId,
    listed_by: session.userId,
    title: parsed.data.title,
    address: parsed.data.address || null,
    city: parsed.data.city || null,
    price: num(parsed.data.price),
    property_type: parsed.data.property_type,
    status: parsed.data.status,
    bedrooms: num(parsed.data.bedrooms),
    bathrooms: num(parsed.data.bathrooms),
    area_sqft: num(parsed.data.area_sqft),
    description: parsed.data.description || null,
  });

  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    organization_id: session.organizationId,
    actor_id: session.userId,
    action: 'listed a property',
    entity_type: 'property',
    metadata: { title: parsed.data.title },
  });

  revalidatePath('/properties');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateProperty(id: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const parsed = propertySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' };

  const supabase = createClient();
  const { error } = await supabase
    .from('properties')
    .update({
      title: parsed.data.title,
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      price: num(parsed.data.price),
      property_type: parsed.data.property_type,
      status: parsed.data.status,
      bedrooms: num(parsed.data.bedrooms),
      bathrooms: num(parsed.data.bathrooms),
      area_sqft: num(parsed.data.area_sqft),
      description: parsed.data.description || null,
    })
    .eq('id', id)
    .eq('organization_id', session.organizationId);

  if (error) return { error: error.message };

  revalidatePath('/properties');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteProperty(id: string): Promise<FormActionState> {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  const supabase = createClient();
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('organization_id', session.organizationId);

  if (error) return { error: error.message };

  revalidatePath('/properties');
  revalidatePath('/dashboard');
  return { success: true };
}
