import { createClient } from '@/lib/supabase/server';
import type { Appointment } from '@/lib/supabase/types';

export async function listAppointments(organizationId: string): Promise<Appointment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('*, clients ( name ), properties ( title )')
    .eq('organization_id', organizationId)
    .order('starts_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as Appointment[];
}
