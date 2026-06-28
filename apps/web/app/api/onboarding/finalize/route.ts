import { NextResponse } from 'next/server';
import { prisma } from '@lumin/db';
import { OnboardingChatFinalizeInput } from '@lumin/shared';
import { inferPersonality } from '@lumin/ai';
import { getSession } from '../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Maps the 12-card value sort to a 10-dim Schwartz vector (mirrors the static
// onboarding handler so the matcher reads identical data regardless of path).
const VALUE_TO_SCHWARTZ: Record<string, number[]> = {
  Family: [0.1, 0.7, 0.5, 0.1, 0.1, 0.6, 0.1, 0.1, 0.7, 0.2],
  Career: [0.9, 0.1, 0.2, 0.2, 0.7, 0.4, 0.4, 0.3, 0.1, 0.1],
  Creativity: [0.4, 0.3, 0.1, 0.4, 0.1, 0.1, 0.9, 0.7, 0.1, 0.3],
  Adventure: [0.2, 0.2, 0.0, 0.6, 0.2, 0.0, 0.6, 1.0, 0.0, 0.2],
  Stability: [0.2, 0.4, 0.7, 0.1, 0.2, 1.0, 0.2, 0.0, 0.6, 0.2],
  Faith: [0.1, 0.5, 0.8, 0.0, 0.1, 0.5, 0.1, 0.0, 1.0, 0.3],
  Health: [0.4, 0.4, 0.4, 0.3, 0.2, 0.7, 0.5, 0.3, 0.2, 0.4],
  Curiosity: [0.4, 0.4, 0.1, 0.3, 0.1, 0.1, 0.9, 0.7, 0.1, 0.5],
  Honesty: [0.3, 0.7, 0.6, 0.1, 0.1, 0.4, 0.5, 0.1, 0.3, 0.7],
  Independence: [0.5, 0.2, 0.1, 0.3, 0.4, 0.3, 1.0, 0.5, 0.1, 0.3],
  Service: [0.2, 1.0, 0.4, 0.1, 0.1, 0.3, 0.2, 0.1, 0.3, 0.9],
  Humor: [0.2, 0.5, 0.1, 0.6, 0.1, 0.1, 0.6, 0.6, 0.1, 0.4],
};

function valuesToSchwartz(values: string[]): number[] {
  const acc = new Array<number>(10).fill(0);
  let n = 0;
  for (const v of values) {
    const vec = VALUE_TO_SCHWARTZ[v];
    if (!vec) continue;
    for (let i = 0; i < 10; i++) acc[i] = (acc[i] ?? 0) + (vec[i] ?? 0);
    n++;
  }
  if (n === 0) return acc;
  const max = Math.max(...acc) || 1;
  return acc.map((x) => x / max);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = OnboardingChatFinalizeInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', detail: parsed.error.flatten() }, { status: 400 });
  }
  const { transcript, acceptedGenders, ageMin, ageMax } = parsed.data;
  if (ageMin >= ageMax) {
    return NextResponse.json({ error: 'age_range_invalid' }, { status: 400 });
  }

  // Infer the trait profile (live Claude or deterministic fallback).
  const { value: p, model, promptVersion } = await inferPersonality({ transcript });
  const schwartz = valuesToSchwartz(p.topValues);

  await prisma.$transaction([
    prisma.profile.update({
      where: { userId: session.sub },
      data: {
        bioShort: p.bioShort,
        relationshipGoal: p.relationshipGoal,
        completionScore: 100,
        curatorReady: true,
      },
    }),
    prisma.preferences.update({
      where: { userId: session.sub },
      data: {
        ageMin,
        ageMax,
        acceptedGenders,
        goalsAcceptable: ['SERIOUS_DATING', 'MARRIAGE', 'LIFE_PARTNER'],
      },
    }),
    prisma.personalityProfile.upsert({
      where: { userId: session.sub },
      create: {
        userId: session.sub,
        attachmentStyle: p.attachmentStyle,
        communicationStyle: p.communicationStyle,
        mbtiType: p.mbtiType,
        openness: p.bigFive.openness,
        conscientiousness: p.bigFive.conscientiousness,
        extraversion: p.bigFive.extraversion,
        agreeableness: p.bigFive.agreeableness,
        neuroticism: p.bigFive.neuroticism,
        modelVersion: 'chatbot-infer-v0.1',
      },
      update: {
        attachmentStyle: p.attachmentStyle,
        communicationStyle: p.communicationStyle,
        mbtiType: p.mbtiType,
        openness: p.bigFive.openness,
        conscientiousness: p.bigFive.conscientiousness,
        extraversion: p.bigFive.extraversion,
        agreeableness: p.bigFive.agreeableness,
        neuroticism: p.bigFive.neuroticism,
        modelVersion: 'chatbot-infer-v0.1',
      },
    }),
    // OnboardingResponse rows, exact keys the matcher reads, plus an audit row.
    prisma.onboardingResponse.upsert({
      where: { userId_questionKey: { userId: session.sub, questionKey: 'values_top5' } },
      create: { userId: session.sub, questionKey: 'values_top5', answer: { picks: p.topValues, schwartz } },
      update: { answer: { picks: p.topValues, schwartz } },
    }),
    prisma.onboardingResponse.upsert({
      where: { userId_questionKey: { userId: session.sub, questionKey: 'attachment_signal' } },
      create: { userId: session.sub, questionKey: 'attachment_signal', answer: { pick: p.attachmentStyle } },
      update: { answer: { pick: p.attachmentStyle } },
    }),
    prisma.onboardingResponse.upsert({
      where: { userId_questionKey: { userId: session.sub, questionKey: 'kids' } },
      create: { userId: session.sub, questionKey: 'kids', answer: { pick: p.wantsKids } },
      update: { answer: { pick: p.wantsKids } },
    }),
    prisma.onboardingResponse.upsert({
      where: { userId_questionKey: { userId: session.sub, questionKey: 'chatbot_inference' } },
      create: {
        userId: session.sub,
        questionKey: 'chatbot_inference',
        answer: { bigFive: p.bigFive, communicationStyle: p.communicationStyle, mbtiType: p.mbtiType, extras: p.extras, model, promptVersion },
      },
      update: {
        answer: { bigFive: p.bigFive, communicationStyle: p.communicationStyle, mbtiType: p.mbtiType, extras: p.extras, model, promptVersion },
      },
    }),
    prisma.aIAgentSession.create({
      data: {
        userId: session.sub,
        mode: 'onboarding_coach',
        transcript: transcript as object[],
        endedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({ ok: true, profile: { communicationStyle: p.communicationStyle, attachmentStyle: p.attachmentStyle } });
}
