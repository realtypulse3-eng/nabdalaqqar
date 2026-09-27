import { getCurrentSession } from '@/lib/services/organizations';
import { listCampaigns } from '@/lib/services/campaigns';
import { CampaignsClient } from './campaigns-client';

export default async function CampaignsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const campaigns = await listCampaigns(session.organizationId);

  return <CampaignsClient initialCampaigns={campaigns} role={session.role} />;
}
