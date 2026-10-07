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

  // Don't take down the whole dashboard over a notifications hiccup —
  // this runs on every single page load via the layout, so any transient
  // DB error here previously crashed the entire app shell.
  if (error) {
    console.error('listNotifications failed:', error);
    return [];
  }
  return (data ?? []) as NotificationRow[];
}
