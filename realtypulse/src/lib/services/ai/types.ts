export interface AgentExecutionInput {
  agentKey: string;
  organizationId: string;
  triggeredBy: string;
  payload?: Record<string, unknown>;
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
