'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-provider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { triggerAgentRun } from '@/lib/actions/ai-agents';
import type { AgentStatus, AiAgent } from '@/lib/supabase/types';

const STATUS_TONE: Record<AgentStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  idle: 'neutral',
  working: 'info',
  analyzing: 'info',
  waiting: 'warning',
  error: 'danger',
  disabled: 'neutral',
};

export function AiAgentsClient({ initialAgents, aiConfigured }: { initialAgents: AiAgent[]; aiConfigured: boolean }) {
  const { t } = useI18n();
  const [agents, setAgents] = useState(initialAgents);
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [lastError, setLastError] = useState<Record<string, string>>({});

  async function handleRun(agent: AiAgent) {
    setRunningKey(agent.key);
    setLastError((prev) => ({ ...prev, [agent.key]: '' }));
    const result = await triggerAgentRun(agent.key);
    if ('error' in result && result.error) {
      setLastError((prev) => ({ ...prev, [agent.key]: result.error! }));
      setAgents((prev) => prev.map((a) => (a.key === agent.key ? { ...a, status: 'error' } : a)));
    } else {
      setAgents((prev) => prev.map((a) => (a.key === agent.key ? { ...a, status: 'idle' } : a)));
    }
    setRunningKey(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-[-0.02em] text-ink">{t('aiAgents.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{t('aiAgents.subtitle')}</p>
        </div>
        <Badge tone={aiConfigured ? 'success' : 'warning'}>
          {aiConfigured ? 'Provider connected' : t('aiAgents.notConfigured')}
        </Badge>
      </div>

      {!aiConfigured && (
        <Card className="border-warning/30 bg-warning/5">
          <p className="text-sm text-warning">{t('aiAgents.notConfiguredBody')}</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-ink">{agent.name}</p>
                <p className="mt-1 text-xs text-ink-muted">{agent.description}</p>
              </div>
              <Badge tone={STATUS_TONE[agent.status]}>{agent.status}</Badge>
            </div>

            {agent.capabilities?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.map((cap) => (
                  <span key={cap} className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-faint">
                    {cap}
                  </span>
                ))}
              </div>
            )}

            {lastError[agent.key] && <p className="text-xs text-danger">{lastError[agent.key]}</p>}

            <div className="mt-auto pt-2">
              <Button
                variant="secondary"
                className="w-full"
                loading={runningKey === agent.key}
                onClick={() => handleRun(agent)}
              >
                {runningKey === agent.key ? t('aiAgents.running') : t('aiAgents.runAgent')}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
