import { getCurrentSession } from '@/lib/services/organizations';
import { createClient } from '@/lib/supabase/server';
import { isProviderConfigured } from '@/lib/services/ai/agent-service';
import { SettingsClient } from './settings-client';

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const supabase = createClient();
  const { data: team } = await supabase
    .from('memberships')
    .select('id, role, profiles ( id, full_name, email )')
    .eq('organization_id', session.organizationId);

  return (
    <SettingsClient
      session={session}
      team={(team ?? []) as any}
      aiConfigured={isProviderConfigured()}
    />
  );
}
