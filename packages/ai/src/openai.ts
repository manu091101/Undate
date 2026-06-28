import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  _client = new OpenAI({
    apiKey,
    maxRetries: 2,
    timeout: 30_000,
  });
  return _client;
}
