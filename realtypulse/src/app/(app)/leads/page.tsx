import { getCurrentSession } from '@/lib/services/organizations';
import { listLeads } from '@/lib/services/leads';
import { LeadsClient } from './leads-client';

export default async function LeadsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const leads = await listLeads(session.organizationId);

  return <LeadsClient initialLeads={leads} role={session.role} />;
}
