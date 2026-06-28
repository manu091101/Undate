import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  _client = new Anthropic({
    apiKey,
    maxRetries: 2,
    timeout: 30_000,
  });
  return _client;
}

export const ANTHROPIC_MODELS = {
  primary: 'claude-sonnet-4-6',
  premium: 'claude-opus-4-7',
  fast: 'claude-haiku-4-5-20251001',
} as const;
