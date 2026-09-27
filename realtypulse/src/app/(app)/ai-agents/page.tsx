import { getCurrentSession } from '@/lib/services/organizations';
import { listAgents, isProviderConfigured } from '@/lib/services/ai/agent-service';
import { AiAgentsClient } from './ai-agents-client';

export default async function AiAgentsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const agents = await listAgents(session.organizationId);

  return <AiAgentsClient initialAgents={agents} aiConfigured={isProviderConfigured()} />;
}
