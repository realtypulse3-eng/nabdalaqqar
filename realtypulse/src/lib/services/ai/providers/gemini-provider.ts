import 'server-only';
import type { AgentExecutionInput, AgentExecutionResult, ModelProvider } from '../types';

// Stable (non-preview) Gemini model as of late 2026. If Google deprecates
// this, swap the string here — nothing else in this file needs to change.
const MODEL = 'gemini-2.5-flash';

export class GeminiProvider implements ModelProvider {
  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async run(input: AgentExecutionInput & { prompt: string }): Promise<AgentExecutionResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        error: 'GEMINI_API_KEY is not set. This agent cannot execute until a provider is configured.',
      };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY!,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${input.prompt}\n\nContext payload:\n${JSON.stringify(input.payload ?? {}, null, 2)}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        return { ok: false, error: `Provider error (${response.status}): ${text}` };
      }

      const data = await response.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';

      return {
        ok: true,
        output: {
          text,
          raw: data,
        },
      };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unknown provider error' };
    }
  }
}
