export interface AgentExecutionInput {
  agentKey: string;
  organizationId: string;
  triggeredBy: string;
  payload?: Record<string, unknown>;
  /** 'en' | 'ar' — the user's chosen UI language. Agent output should be written in this language. */
  locale?: string;
}

export interface AgentExecutionResult {
  ok: boolean;
  output?: Record<string, unknown>;
  error?: string;
}

export interface ModelProvider {
  isConfigured(): boolean;
  run(input: AgentExecutionInput & { prompt: string }): Promise<AgentExecutionResult>;
}
