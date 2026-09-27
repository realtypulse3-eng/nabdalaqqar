import { getCurrentSession } from '@/lib/services/organizations';
import { listConversations } from '@/lib/services/conversations';
import { listClients } from '@/lib/services/clients';
import { listLeads } from '@/lib/services/leads';
import { CommunicationsClient } from './communications-client';

export default async function CommunicationsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const [conversations, clients, leads] = await Promise.all([
    listConversations(session.organizationId),
    listClients(session.organizationId),
    listLeads(session.organizationId),
  ]);

  return (
    <CommunicationsClient
      initialConversations={conversations}
      clients={clients}
      leads={leads}
      role={session.role}
    />
  );
}
