// Live matching endpoint. Runs the cold-start ranker against every other
// active user in the same residency region and returns the top N with a
// human-readable explanation of *why* they ranked.
//
// In production this is replaced by the Saturday Temporal pipeline +
// LightGBM ranker + curator review. For the MVP we run it on demand so
// the demo + early alpha both work today.

import { NextResponse } from 'next/server';
import { prisma } from '@lumin/db';
import {
  type AttachmentStyle,
  type KidsPref,
  type RelationshipGoal,
  type UserFeatures,
  rank,
  explainTopAxes,
} from '@lumin/shared';
import { getSession } from '../../../../lib/auth';
import { resolvePhotoUrl, fallbackAvatar } from '../../../../lib/photo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UserRow {
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
  photos: { id: string; s3Key: string; orderIdx: number; isPrimary: boolean }[];
}

function yearsBetween(then: Date, now: Date = new Date()): number {
  const ms = now.getTime() - then.getTime();
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000));
}

function extractSchwartz(rows: UserRow['onboardingResponses']): number[] | undefined {
  const r = rows.find((x) => x.questionKey === 'values_top5');
  if (!r || typeof r.answer !== 'object' || !r.answer) return undefined;
  const a = r.answer as { schwartz?: number[] };
  return Array.isArray(a.schwartz) ? a.schwartz : undefined;
}

function extractKids(rows: UserRow['onboardingResponses']): KidsPref {
  const r = rows.find((x) => x.questionKey === 'kids');
  if (!r || typeof r.answer !== 'object' || !r.answer) return 'UNKNOWN';
  const pick = (r.answer as { pick?: string }).pick;
  if (
    pick === 'YES' ||
    pick === 'NO' ||
    pick === 'OPEN' ||
    pick === 'HAVE_WANT_MORE' ||
    pick === 'HAVE_DONE'
  )
    return pick;
  return 'UNKNOWN';
}

function toFeatures(row: UserRow): UserFeatures | null {
  if (!row.profile) return null;
  return {
    userId: row.id,
    age: yearsBetween(row.profile.dateOfBirth),
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
    valuesVec: extractSchwartz(row.onboardingResponses),
    wantsKids: extractKids(row.onboardingResponses),
    communicationStyle: row.personality?.communicationStyle ?? undefined,
    mbti: row.personality?.mbtiType ?? undefined,
  };
}

const userSelect = {
  id: true,
  residencyRegion: true,
  profile: {
    select: {
      displayName: true,
      dateOfBirth: true,
      gender: true,
      city: true,
      bioShort: true,
      relationshipGoal: true,
    },
  },
  personality: {
    select: {
      attachmentStyle: true,
      communicationStyle: true,
      mbtiType: true,
      openness: true,
      conscientiousness: true,
      extraversion: true,
      agreeableness: true,
      neuroticism: true,
    },
  },
  onboardingResponses: { select: { questionKey: true, answer: true } },
  photos: {
    where: { moderationStatus: 'APPROVED' as const },
    orderBy: { orderIdx: 'asc' as const },
    select: { id: true, s3Key: true, orderIdx: true, isPrimary: true },
  },
} as const;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const meRaw = await prisma.user.findUnique({
    where: { id: session.sub },
    select: userSelect,
  });
  const me = meRaw as unknown as UserRow | null;
  if (!me || !me.profile) {
    return NextResponse.json({ error: 'profile_incomplete' }, { status: 400 });
  }

  const myFeatures = toFeatures(me);
  if (!myFeatures) {
    return NextResponse.json({ error: 'profile_incomplete' }, { status: 400 });
  }

  // Get preferences to apply hard filters before scoring.
  const prefs = await prisma.preferences.findUnique({
    where: { userId: me.id },
    select: { ageMin: true, ageMax: true, acceptedGenders: true },
  });

  const candidatesRaw = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      status: 'ACTIVE',
      residencyRegion: me.residencyRegion as 'IN' | 'SG' | 'EU' | 'US' | 'AE' | 'OTHER',
      profile: {
        is: {
          ...(prefs?.acceptedGenders?.length ? { gender: { in: prefs.acceptedGenders } } : {}),
        },
      },
    },
    select: userSelect,
    take: 200,
  });
  const candidates = candidatesRaw as unknown as UserRow[];

  const candidateFeatures = candidates
    .map(toFeatures)
    .filter((f): f is UserFeatures => f !== null)
    .filter((f) => {
      if (!prefs) return true;
      return f.age >= prefs.ageMin && f.age <= prefs.ageMax;
    });

  const ranked = rank(myFeatures, candidateFeatures, 5);

  const enriched = ranked.map((r) => {
    const row = candidates.find((c) => c.id === r.userId)!;
    const reasons = explainTopAxes(r.breakdown);
    return {
      userId: r.userId,
      score: Number(r.score.toFixed(3)),
      breakdown: {
        attachment: Number(r.breakdown.attachment.toFixed(2)),
        goal: Number(r.breakdown.goal.toFixed(2)),
        kids: Number(r.breakdown.kids.toFixed(2)),
        values: Number(r.breakdown.values.toFixed(2)),
        neuroticismRisk: Number(r.breakdown.neuroticismRisk.toFixed(2)),
        traitHarmony: Number(r.breakdown.traitHarmony.toFixed(2)),
        commStyle: Number(r.breakdown.commStyle.toFixed(2)),
        mbti: Number(r.breakdown.mbti.toFixed(2)),
        age: Number(r.breakdown.age.toFixed(2)),
      },
      reasons,
      profile: {
        displayName: row.profile?.displayName ?? 'Member',
        age: yearsBetween(row.profile!.dateOfBirth),
        city: row.profile?.city ?? '—',
        gender: row.profile?.gender ?? '—',
        bioShort: row.profile?.bioShort ?? null,
        photos: row.photos
          .map((p) => resolvePhotoUrl(p.s3Key))
          .filter((u): u is string => !!u),
        primaryPhoto:
          row.photos
            .map((p) => resolvePhotoUrl(p.s3Key))
            .find((u): u is string => !!u) ??
          fallbackAvatar(row.profile?.displayName ?? 'm', row.profile?.gender ?? null),
      },
    };
  });

  return NextResponse.json({
    ok: true,
    rankerVersion: 'cold-start-v0.1',
    weekId: weekIdNow(),
    you: { city: me.profile.city, region: me.residencyRegion },
    candidates: enriched,
  });
}

function weekIdNow(): string {
  const d = new Date();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / 86400000;
  const week = 1 + Math.floor(diff / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
