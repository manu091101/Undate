// The Agentic Matching Ring. For the current member we rank the pool, then run
// agent-vs-agent "mock dates" on the top few candidates, and surface the single
// best match with a debrief of why the agents clicked. Humans take over the chat.

import { NextResponse } from 'next/server';
import { prisma } from '@lumin/db';
import {
  type AttachmentStyle,
  type KidsPref,
  type RelationshipGoal,
  type UserFeatures,
  rank,
  computeBreakdown,
} from '@lumin/shared';
import { simulateMockDate, type AgentPersona } from '@lumin/ai';
import { getSession } from '../../../../lib/auth';
import { resolvePhotoUrl, fallbackAvatar } from '../../../../lib/photo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RING_SIZE = 6; // how many agents enter the ring (bounds live-LLM cost)
const RETURN_N = 1; // one intentional, curated introduction per cycle

interface Row {
  id: string;
  residencyRegion: string;
  profile: {
    displayName: string;
    dateOfBirth: Date;
    gender: string;
    city: string;
    bioShort: string | null;
    relationshipGoal: string | null;
  } | null;
  personality: {
    attachmentStyle: string;
    communicationStyle: string | null;
    mbtiType: string | null;
    openness: number | null;
    conscientiousness: number | null;
    extraversion: number | null;
    agreeableness: number | null;
    neuroticism: number | null;
  } | null;
  onboardingResponses: { questionKey: string; answer: unknown }[];
  photos: { s3Key: string; orderIdx: number; isPrimary: boolean }[];
}

const select = {
  id: true,
  residencyRegion: true,
  profile: {
    select: { displayName: true, dateOfBirth: true, gender: true, city: true, bioShort: true, relationshipGoal: true },
  },
  personality: {
    select: {
      attachmentStyle: true, communicationStyle: true, mbtiType: true,
      openness: true, conscientiousness: true, extraversion: true, agreeableness: true, neuroticism: true,
    },
  },
  onboardingResponses: { select: { questionKey: true, answer: true } },
  photos: {
    where: { moderationStatus: 'APPROVED' as const },
    orderBy: { orderIdx: 'asc' as const },
    select: { s3Key: true, orderIdx: true, isPrimary: true },
  },
} as const;

function age(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}
function schwartz(rows: Row['onboardingResponses']): number[] | undefined {
  const r = rows.find((x) => x.questionKey === 'values_top5');
  const a = r?.answer as { schwartz?: number[] } | undefined;
  return Array.isArray(a?.schwartz) ? a!.schwartz : undefined;
}
function picks(rows: Row['onboardingResponses']): string[] {
  const r = rows.find((x) => x.questionKey === 'values_top5');
  const a = r?.answer as { picks?: string[] } | undefined;
  return Array.isArray(a?.picks) ? a!.picks! : [];
}
function kids(rows: Row['onboardingResponses']): KidsPref {
  const r = rows.find((x) => x.questionKey === 'kids');
  const p = (r?.answer as { pick?: string } | undefined)?.pick;
  return p === 'YES' || p === 'NO' || p === 'OPEN' || p === 'HAVE_WANT_MORE' || p === 'HAVE_DONE' ? p : 'UNKNOWN';
}
function toFeatures(row: Row): UserFeatures | null {
  if (!row.profile) return null;
  return {
    userId: row.id,
    age: age(row.profile.dateOfBirth),
    gender: row.profile.gender,
    city: row.profile.city,
    region: row.residencyRegion,
    relationshipGoal: (row.profile.relationshipGoal ?? 'EXPLORING') as RelationshipGoal,
    attachment: (row.personality?.attachmentStyle ?? 'UNKNOWN') as AttachmentStyle,
    bigFive: row.personality
      ? [
          row.personality.openness ?? 0.5,
          row.personality.conscientiousness ?? 0.5,
          row.personality.extraversion ?? 0.5,
          row.personality.agreeableness ?? 0.5,
          row.personality.neuroticism ?? 0.5,
        ]
      : undefined,
    valuesVec: schwartz(row.onboardingResponses),
    wantsKids: kids(row.onboardingResponses),
    communicationStyle: row.personality?.communicationStyle ?? undefined,
    mbti: row.personality?.mbtiType ?? undefined,
  };
}
function toPersona(row: Row): AgentPersona {
  return {
    name: row.profile?.displayName ?? 'Member',
    age: row.profile ? age(row.profile.dateOfBirth) : 30,
    bio: row.profile?.bioShort ?? null,
    mbti: row.personality?.mbtiType ?? null,
    attachment: row.personality?.attachmentStyle ?? null,
    communicationStyle: row.personality?.communicationStyle ?? null,
    topValues: picks(row.onboardingResponses),
    intention: row.profile?.relationshipGoal ?? null,
    wantsKids: kids(row.onboardingResponses) === 'UNKNOWN' ? null : kids(row.onboardingResponses),
  };
}
function primaryPhoto(row: Row): string {
  return (
    row.photos.map((p) => resolvePhotoUrl(p.s3Key)).find((u): u is string => !!u) ??
    fallbackAvatar(row.profile?.displayName ?? 'm', row.profile?.gender ?? null)
  );
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const meRaw = (await prisma.user.findUnique({ where: { id: session.sub }, select })) as unknown as Row | null;
  if (!meRaw?.profile) return NextResponse.json({ error: 'profile_incomplete' }, { status: 400 });
  const myFeatures = toFeatures(meRaw);
  if (!myFeatures) return NextResponse.json({ error: 'profile_incomplete' }, { status: 400 });

  const prefs = await prisma.preferences.findUnique({
    where: { userId: meRaw.id },
    select: { ageMin: true, ageMax: true, acceptedGenders: true },
  });

  const candidatesRaw = (await prisma.user.findMany({
    where: {
      id: { not: meRaw.id },
      status: 'ACTIVE',
      residencyRegion: meRaw.residencyRegion as 'IN' | 'SG' | 'EU' | 'US' | 'AE' | 'OTHER',
      profile: { is: { ...(prefs?.acceptedGenders?.length ? { gender: { in: prefs.acceptedGenders } } : {}) } },
    },
    select,
    take: 200,
  })) as unknown as Row[];

  const candFeatures = candidatesRaw
    .map(toFeatures)
    .filter((f): f is UserFeatures => f !== null)
    .filter((f) => (prefs ? f.age >= prefs.ageMin && f.age <= prefs.ageMax : true));

  const ranked = rank(myFeatures, candFeatures, RING_SIZE);
  if (ranked.length === 0) {
    return NextResponse.json({ ok: true, weekId: weekId(), matches: [], ran: 0, screened: candFeatures.length });
  }

  const myPersona = toPersona(meRaw);

  // Run the ring: a mock date per top candidate (real algorithm picks who enters).
  const rounds = await Promise.all(
    ranked.map(async (r) => {
      const row = candidatesRaw.find((c) => c.id === r.userId)!;
      const breakdown = computeBreakdown(myFeatures, toFeatures(row)!);
      const { value: mock } = await simulateMockDate(myPersona, toPersona(row), { score: r.score, breakdown });
      // Final ordering blends the rule-based algorithm (dominant) with agent chemistry.
      const combined = 0.6 * r.score + 0.4 * mock.chemistry;
      return { row, score: r.score, breakdown, mock, combined };
    }),
  );

  rounds.sort((a, b) => b.combined - a.combined);
  const top = rounds.slice(0, RETURN_N);

  // Persist the winning mock-date transcript for audit/realism.
  const win = top[0]!;
  await prisma.aIAgentSession.create({
    data: {
      userId: meRaw.id,
      mode: 'agent_mock_date',
      transcript: { opponent: win.row.id, chemistry: win.mock.chemistry, lines: win.mock.transcript } as object,
      endedAt: new Date(),
    },
  }).catch(() => undefined);

  const matches = top.map((r) => ({
    userId: r.row.id,
    score: Number(r.score.toFixed(3)),
    chemistry: Number(r.mock.chemistry.toFixed(3)),
    combined: Number(r.combined.toFixed(3)),
    breakdown: Object.fromEntries(
      Object.entries(r.breakdown).map(([k, v]) => [k, Number((v as number).toFixed(2))]),
    ),
    debrief: r.mock.debrief,
    sparks: r.mock.sparks,
    frictions: r.mock.frictions,
    transcript: r.mock.transcript,
    profile: {
      displayName: r.row.profile?.displayName ?? 'Member',
      age: r.row.profile ? age(r.row.profile.dateOfBirth) : 30,
      city: r.row.profile?.city ?? ', ',
      gender: r.row.profile?.gender ?? ', ',
      bioShort: r.row.profile?.bioShort ?? null,
      mbti: r.row.personality?.mbtiType ?? null,
      communicationStyle: r.row.personality?.communicationStyle ?? null,
      primaryPhoto: primaryPhoto(r.row),
    },
  }));

  return NextResponse.json({ ok: true, weekId: weekId(), ran: rounds.length, screened: candFeatures.length, matches });
}

function weekId(): string {
  const d = new Date();
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dayNum + 3);
  const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.floor((t.getTime() - firstThu.getTime()) / 86400000 / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
