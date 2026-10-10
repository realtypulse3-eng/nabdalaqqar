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

    // The provider call can fail without throwing (bad key, wrong model,
    // quota). runAgent records that on the run row — surface it here
    // instead of reporting a failed run as a success.
    if (run.status === 'failed') {
      return { error: run.error ?? 'The AI provider returned an error.' };
    }

    const output = run.output as { text?: string } | null;
    return { run, text: output?.text ?? '' };
  } catch (e) {
    // Supabase errors are plain objects, not Error instances, so the old
    // `e instanceof Error` check discarded their message entirely.
    const message =
      e instanceof Error
        ? e.message
        : typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to run agent.';
    console.error('triggerAgentRun failed:', e);
    return { error: message };
  }
}
