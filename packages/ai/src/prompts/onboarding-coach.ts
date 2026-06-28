import { z } from 'zod';
import { ANTHROPIC_MODELS, getAnthropic } from '../anthropic';

const PROMPT_VERSION = 'onboarding-coach-v0.1';

export interface OnboardingCoachInput {
  /** Conversation so far, oldest first. */
  history: { role: 'assistant' | 'user'; content: string }[];
  /** 0-based index of the question the bot is about to ask. */
  turnIndex: number;
  displayName?: string;
}

export const OnboardingTurnSchema = z.object({
  message: z.string().min(1).max(600),
  done: z.boolean(),
});
export type OnboardingTurn = z.infer<typeof OnboardingTurnSchema>;

// Deterministic fallback script — one warm question per "signal zone". Used when
// ANTHROPIC_API_KEY is absent or a live call fails, so onboarding always works.
const SCRIPT: string[] = [
  // 0 — opening: extraversion, lifestyle pace, openness
  "Hi — I'm your Undate matchmaker. Before I introduce you to anyone, I'd love to get a real feel for you — no right answers here. To start: what does a genuinely good weekend look like for you these days?",
  // 1 — draw: values, openness, intention hints
  'I like that. When you meet someone and feel a real pull toward them, what is it usually about them that does it?',
  // 2 — repair: attachment, neuroticism, conversation style
  "That's helpful. Here's a slightly deeper one — when something feels off between you and someone you're close to, what do you actually tend to do in the moment?",
  // 3 — conscientiousness / reliability
  "Good to know. When you commit to something that matters — a plan, a promise, a person — how do you tend to follow through when life gets busy?",
  // 4 — matters: Schwartz values
  "Thank you for being honest. What's something that's been mattering to you a lot lately — something you'd really want a partner to understand about you?",
  // 5 — horizon: intention, kids
  'When you picture the next few years of your life, what are you actually hoping to build — and does that picture include a family?',
  // 6 — lighter close: humour, openness, novelty
  'Last one, and lighter: what reliably makes you laugh, and when did you last surprise yourself by trying something new?',
];

export function scriptedTurn(turnIndex: number): OnboardingTurn {
  const idx = Math.max(0, Math.min(turnIndex, SCRIPT.length - 1));
  return { message: SCRIPT[idx]!, done: idx >= SCRIPT.length - 1 };
}

const SYSTEM = `You are the Undate matchmaker: warm, curious, unhurried, a little witty.
You are having a short getting-to-know-you conversation with a new member.

Your goal is to gently learn — WITHOUT ever asking directly — their personality
(Big Five), how they handle closeness and conflict (attachment style), how they
communicate, what they value, and what they're looking for (intentions, children).

Rules:
- Ask exactly ONE short, natural question per turn. No lists, no multiple-choice.
- Lightly acknowledge what they just said, then ask your next question.
- NEVER use psychology jargon (no "attachment", "extraversion", "Big Five").
- NEVER ask them to rate or label themselves.
- Keep it to 1–3 sentences. No emoji.
- Do NOT ask about protected attributes (religion, sexuality, health, ethnicity).
- Cover, across the whole conversation: their energy / ideal weekend; what draws
  them to someone; how they handle things going wrong with someone close; how they
  follow through on commitments when busy (reliability); what matters to them
  lately (values); what they want to build (and family); and one lighter question
  about humour or trying new things.
- Probe for real signal but stay warm — let what they say shape your next question.
- Set "done" to true on your final question, once roughly seven exchanges are done.
- Output strict JSON only: {"message": string, "done": boolean}.`;

export async function generateOnboardingTurn(
  input: OnboardingCoachInput,
): Promise<{ value: OnboardingTurn; model: string; promptVersion: string }> {
  // Hybrid: deterministic script when no API key.
  if (!process.env.ANTHROPIC_API_KEY) {
    return { value: scriptedTurn(input.turnIndex), model: 'scripted-fallback', promptVersion: PROMPT_VERSION };
  }

  try {
    const client = getAnthropic();
    const convo = input.history
      .map((m) => `${m.role === 'assistant' ? 'You' : 'Member'}: ${m.content}`)
      .join('\n');
    const user = `Conversation so far (turn ${input.turnIndex}, aim for ~6 questions total):\n${
      convo || '(no messages yet — open the conversation)'
    }\n\nReturn the next turn as JSON.`;

    const resp = await client.messages.create({
      model: ANTHROPIC_MODELS.primary,
      max_tokens: 300,
      temperature: 0.6,
      system: SYSTEM,
      messages: [{ role: 'user', content: user }],
    });
    const text = resp.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
      .trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end < 0) throw new Error('no json');
    const value = OnboardingTurnSchema.parse(JSON.parse(text.slice(start, end + 1)));
    // Safety net: force the conversation to end by the script length.
    if (input.turnIndex >= SCRIPT.length - 1) value.done = true;
    return { value, model: ANTHROPIC_MODELS.primary, promptVersion: PROMPT_VERSION };
  } catch {
    return { value: scriptedTurn(input.turnIndex), model: 'scripted-fallback', promptVersion: PROMPT_VERSION };
  }
}

export const ONBOARDING_MAX_TURNS = SCRIPT.length;
