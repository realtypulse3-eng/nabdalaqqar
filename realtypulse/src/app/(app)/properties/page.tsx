import { getCurrentSession } from '@/lib/services/organizations';
import { listProperties } from '@/lib/services/properties';
import { PropertiesClient } from './properties-client';

export default async function PropertiesPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const properties = await listProperties(session.organizationId);

  return <PropertiesClient initialProperties={properties} role={session.role} />;
}
