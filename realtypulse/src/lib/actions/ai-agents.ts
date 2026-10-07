'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentSession } from '@/lib/services/organizations';
import { runAgent } from '@/lib/services/ai/agent-service';
import { getLocale } from '@/lib/i18n/get-dictionary';

export async function triggerAgentRun(agentKey: string) {
  const session = await getCurrentSession();
  if (!session) return { error: 'Not authenticated.' };

  try {
    const run = await runAgent({
      agentKey,
      organizationId: session.organizationId,
      triggeredBy: session.userId,
      locale: getLocale(),
    });
    revalidatePath('/ai-agents');
    return { run };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to run agent.' };
  }
}
