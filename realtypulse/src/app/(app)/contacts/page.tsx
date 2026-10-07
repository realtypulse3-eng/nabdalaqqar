import { getCurrentSession } from '@/lib/services/organizations';
import { listClients } from '@/lib/services/clients';
import { ContactsClient } from './contacts-client';

export default async function ContactsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const clients = await listClients(session.organizationId);

  return <ContactsClient initialClients={clients} role={session.role} />;
}
