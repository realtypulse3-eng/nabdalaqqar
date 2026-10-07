import { getCurrentSession } from '@/lib/services/organizations';
import { listDeals } from '@/lib/services/deals';
import { listProperties } from '@/lib/services/properties';
import { listClients } from '@/lib/services/clients';
import { DealsClient } from './deals-client';

export default async function DealsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const [deals, properties, clients] = await Promise.all([
    listDeals(session.organizationId),
    listProperties(session.organizationId),
    listClients(session.organizationId),
  ]);

  return <DealsClient initialDeals={deals} properties={properties} clients={clients} role={session.role} />;
}
