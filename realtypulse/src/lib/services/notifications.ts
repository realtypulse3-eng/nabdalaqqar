import { createClient } from '@/lib/supabase/server';
import type { NotificationRow } from '@/lib/supabase/types';

export async function listNotifications(userId: string): Promise<NotificationRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}
