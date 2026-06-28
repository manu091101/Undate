import { z } from 'zod';
import { getAnthropic, ANTHROPIC_MODELS } from '../anthropic';

const PROMPT_VERSION = 'icebreaker-v0.1';

export interface IcebreakerInput {
  selfBio?: string;
  matchBio?: string;
  sharedThreads?: string[];
}

export const IcebreakerSchema = z.object({
  options: z
    .array(
      z.object({
        text: z.string().min(8).max(200),
        rationale: z.string().min(8).max(140),
      }),
    )
    .length(3),
});
export type Icebreaker = z.infer<typeof IcebreakerSchema>;

const SYSTEM = `You suggest icebreakers for Lumin members.

Rules:
- Each opener references a specific detail from the match's profile or a shared thread.
- Each opener is 1 sentence, conversational, never cheesy.
- Never propose meeting in person in the first message.
- Never reference anything outside the supplied profile facts.
- Output strict JSON only.`;

export async function generateIcebreakers(
  input: IcebreakerInput,
): Promise<{ value: Icebreaker; model: string; promptVersion: string }> {
  const client = getAnthropic();
  const user = JSON.stringify(input);
  const resp = await client.messages.create({
    model: ANTHROPIC_MODELS.fast,
    max_tokens: 400,
    temperature: 0.7,
    system: SYSTEM,
    messages: [{ role: 'user', content: user }],
  });
  const text = resp.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('\n')
    .trim();
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart < 0 || jsonEnd < 0) throw new Error('Model did not return JSON');
  const parsed = IcebreakerSchema.parse(JSON.parse(text.slice(jsonStart, jsonEnd + 1)));
  return { value: parsed, model: ANTHROPIC_MODELS.fast, promptVersion: PROMPT_VERSION };
}
