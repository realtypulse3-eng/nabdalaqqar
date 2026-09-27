import 'server-only';
import type { AgentExecutionInput, AgentExecutionResult, ModelProvider } from '../types';

const MODEL = 'claude-sonnet-4-6';

export class AnthropicProvider implements ModelProvider {
  isConfigured(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async run(input: AgentExecutionInput & { prompt: string }): Promise<AgentExecutionResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        error: 'ANTHROPIC_API_KEY is not set. This agent cannot execute until a provider is configured.',
      };
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `${input.prompt}\n\nContext payload:\n${JSON.stringify(input.payload ?? {}, null, 2)}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return { ok: false, error: `Provider error (${response.status}): ${text}` };
      }

      const data = await response.json();
      const textBlock = data.content?.find((c: { type: string }) => c.type === 'text');

      return {
        ok: true,
        output: {
          text: textBlock?.text ?? '',
          raw: data,
        },
      };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unknown provider error' };
    }
  }
}
