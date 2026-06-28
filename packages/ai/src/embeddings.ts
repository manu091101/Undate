import { getOpenAI } from './openai';

const MODEL = process.env.LUMIN_EMBED_MODEL ?? 'text-embedding-3-large';

export async function embedText(input: string, dims?: number): Promise<number[]> {
  const openai = getOpenAI();
  const resp = await openai.embeddings.create({
    model: MODEL,
    input,
    ...(dims ? { dimensions: dims } : {}),
  });
  return resp.data[0]!.embedding;
}

export async function embedBatch(inputs: string[], dims?: number): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const openai = getOpenAI();
  const resp = await openai.embeddings.create({
    model: MODEL,
    input: inputs,
    ...(dims ? { dimensions: dims } : {}),
  });
  return resp.data.map((d) => d.embedding);
}
