import { NextResponse } from 'next/server';
import { OnboardingChatInput } from '@lumin/shared';
import { generateOnboardingTurn } from '@lumin/ai';
import { getSession } from '../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/onboarding/chat, given the conversation so far, return the bot's
// next question. Hybrid: live Claude when ANTHROPIC_API_KEY is set, scripted
// fallback otherwise.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = OnboardingChatInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', detail: parsed.error.flatten() }, { status: 400 });
  }

  const history = parsed.data.history;
  const turnIndex = history.filter((m) => m.role === 'assistant').length;

  try {
    const { value } = await generateOnboardingTurn({ history, turnIndex, displayName: session.email });
    return NextResponse.json({ ok: true, message: value.message, done: value.done, turnIndex });
  } catch (e) {
    console.error('[onboarding/chat] failed', e);
    return NextResponse.json({ error: 'chat_failed' }, { status: 500 });
  }
}
