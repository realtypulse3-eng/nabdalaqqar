import { createClient } from '@/lib/supabase/server';
import type { Task } from '@/lib/supabase/types';

export async function listTasks(organizationId: string): Promise<Task[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', organizationId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as Task[];
}
