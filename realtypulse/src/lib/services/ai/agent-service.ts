import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { AiAgent, AiAgentRun } from '@/lib/supabase/types';
import { AnthropicProvider } from './providers/anthropic-provider';
import type { AgentExecutionInput, ModelProvider } from './types';

const defaultProvider: ModelProvider = new AnthropicProvider();

export async function listAgents(organizationId: string): Promise<AiAgent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as AiAgent[];
}

export async function listAgentRuns(agentId: string, limit = 10): Promise<AiAgentRun[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ai_agent_runs')
    .select('*')
    .eq('agent_id', agentId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AiAgentRun[];
}

export function isProviderConfigured(): boolean {
  return defaultProvider.isConfigured();
}

export async function runAgent(input: AgentExecutionInput): Promise<AiAgentRun> {
  const supabase = createClient();

  const { data: agent, error: agentError } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('organization_id', input.organizationId)
    .eq('key', input.agentKey)
    .single();

  if (agentError || !agent) {
    throw new Error(`Unknown agent: ${input.agentKey}`);
  }

  const { data: run, error: insertError } = await supabase
    .from('ai_agent_runs')
    .insert({
      agent_id: agent.id,
      organization_id: input.organizationId,
      triggered_by: input.triggeredBy,
      status: 'running',
      input: input.payload ?? {},
    })
    .select('*')
    .single();

  if (insertError || !run) throw insertError ?? new Error('Failed to create agent run');

  const prompt =
    (agent.config as { prompt?: string })?.prompt ??
    `You are ${agent.name}, an AI agent for a real estate CRM. Description: ${agent.description ?? 'n/a'}. Capabilities: ${(agent.capabilities ?? []).join(', ')}.`;

  const result = await defaultProvider.run({ ...input, prompt });

  const { data: updatedRun, error: updateError } = await supabase
    .from('ai_agent_runs')
    .update({
      status: result.ok ? 'succeeded' : 'failed',
      output: result.output ?? null,
      error: result.error ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq('id', run.id)
    .select('*')
    .single();

  if (updateError || !updatedRun) throw updateError ?? new Error('Failed to record agent run result');

  await supabase
    .from('ai_agents')
    .update({ status: result.ok ? 'idle' : 'error' })
    .eq('id', agent.id);

  return updatedRun as AiAgentRun;
}
