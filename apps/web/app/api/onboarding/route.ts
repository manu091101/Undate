import { NextResponse } from 'next/server';
import { prisma } from '@lumin/db';
import { OnboardingSubmitInput } from '@lumin/shared';
import { getSession } from '../../../lib/auth';

export const runtime = 'nodejs';

// Maps the 12-card value sort to a 10-dim Schwartz vector. Cards that don't
// map cleanly to a Schwartz axis nudge multiple axes lightly.
const VALUE_TO_SCHWARTZ: Record<string, number[]> = {
  // [achievement, benevolence, conformity, hedonism, power, security,
  //  self-direction, stimulation, tradition, universalism]
  Family:       [0.1, 0.7, 0.5, 0.1, 0.1, 0.6, 0.1, 0.1, 0.7, 0.2],
  Career:       [0.9, 0.1, 0.2, 0.2, 0.7, 0.4, 0.4, 0.3, 0.1, 0.1],
  Creativity:   [0.4, 0.3, 0.1, 0.4, 0.1, 0.1, 0.9, 0.7, 0.1, 0.3],
  Adventure:    [0.2, 0.2, 0.0, 0.6, 0.2, 0.0, 0.6, 1.0, 0.0, 0.2],
  Stability:    [0.2, 0.4, 0.7, 0.1, 0.2, 1.0, 0.2, 0.0, 0.6, 0.2],
  Faith:        [0.1, 0.5, 0.8, 0.0, 0.1, 0.5, 0.1, 0.0, 1.0, 0.3],
  Health:       [0.4, 0.4, 0.4, 0.3, 0.2, 0.7, 0.5, 0.3, 0.2, 0.4],
  Curiosity:    [0.4, 0.4, 0.1, 0.3, 0.1, 0.1, 0.9, 0.7, 0.1, 0.5],
  Honesty:      [0.3, 0.7, 0.6, 0.1, 0.1, 0.4, 0.5, 0.1, 0.3, 0.7],
  Independence: [0.5, 0.2, 0.1, 0.3, 0.4, 0.3, 1.0, 0.5, 0.1, 0.3],
  Service:      [0.2, 1.0, 0.4, 0.1, 0.1, 0.3, 0.2, 0.1, 0.3, 0.9],
  Humor:        [0.2, 0.5, 0.1, 0.6, 0.1, 0.1, 0.6, 0.6, 0.1, 0.4],
};

function valuesToSchwartz(values: string[]): number[] {
  const acc = new Array(10).fill(0);
  let n = 0;
  for (const v of values) {
    const vec = VALUE_TO_SCHWARTZ[v];
    if (!vec) continue;
    for (let i = 0; i < 10; i++) acc[i] += vec[i];
    n++;
  }
  if (n === 0) return acc;
  // Normalize so the resulting cosine is meaningful.
  const max = Math.max(...acc) || 1;
  return acc.map((x) => x / max);
}

// Map the single attachment-signal answer to a Big Five neuroticism prior.
// Anxious style → higher neuroticism. Conservative deltas (we'll refine with a
// real assessment later).
const ATTACHMENT_NEUROTICISM: Record<string, number> = {
  SECURE: 0.35,
  ANXIOUS: 0.7,
  AVOIDANT: 0.45,
  DISORGANIZED: 0.65,
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = OnboardingSubmitInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', detail: parsed.error.flatten() }, { status: 400 });
  }
  const v = parsed.data;
  if (v.ageMin >= v.ageMax) {
    return NextResponse.json({ error: 'age_range_invalid' }, { status: 400 });
  }

  const schwartz = valuesToSchwartz(v.topValues);
  const neuroticism = ATTACHMENT_NEUROTICISM[v.attachmentSignal] ?? 0.5;

  // Persist all four facets in one transaction so partial onboarding never
  // produces a half-curated profile.
  await prisma.$transaction([
    prisma.profile.update({
      where: { userId: session.sub },
      data: {
        bioShort: v.bioShort,
        relationshipGoal: v.relationshipGoal,
        completionScore: 100,
        curatorReady: true,
      },
    }),
    prisma.preferences.update({
      where: { userId: session.sub },
      data: {
        ageMin: v.ageMin,
        ageMax: v.ageMax,
        acceptedGenders: v.acceptedGenders,
        goalsAcceptable: ['SERIOUS_DATING', 'MARRIAGE', 'LIFE_PARTNER'],
      },
    }),
    prisma.personalityProfile.upsert({
      where: { userId: session.sub },
      create: {
        userId: session.sub,
        attachmentStyle: v.attachmentSignal,
        neuroticism,
        // We didn't measure the other four yet; default to mid + small jitter so
        // ranker has something to work with. Real Big Five comes in v1.1.
        openness: 0.55,
        conscientiousness: 0.55,
        extraversion: v.lifestylePace / 7,
        agreeableness: 0.55,
        modelVersion: 'onboarding-v0.1',
      },
      update: {
        attachmentStyle: v.attachmentSignal,
        neuroticism,
        extraversion: v.lifestylePace / 7,
      },
    }),
    // Store the raw card pick + signals as OnboardingResponse rows for audit/replay.
    prisma.onboardingResponse.upsert({
      where: { userId_questionKey: { userId: session.sub, questionKey: 'values_top5' } },
      create: { userId: session.sub, questionKey: 'values_top5', answer: { picks: v.topValues, schwartz } },
      update: { answer: { picks: v.topValues, schwartz } },
    }),
    prisma.onboardingResponse.upsert({
      where: { userId_questionKey: { userId: session.sub, questionKey: 'attachment_signal' } },
      create: { userId: session.sub, questionKey: 'attachment_signal', answer: { pick: v.attachmentSignal } },
      update: { answer: { pick: v.attachmentSignal } },
    }),
    prisma.onboardingResponse.upsert({
      where: { userId_questionKey: { userId: session.sub, questionKey: 'lifestyle_pace' } },
      create: { userId: session.sub, questionKey: 'lifestyle_pace', answer: { value: v.lifestylePace } },
      update: { answer: { value: v.lifestylePace } },
    }),
    prisma.onboardingResponse.upsert({
      where: { userId_questionKey: { userId: session.sub, questionKey: 'kids' } },
      create: { userId: session.sub, questionKey: 'kids', answer: { pick: v.wantsKids } },
      update: { answer: { pick: v.wantsKids } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
