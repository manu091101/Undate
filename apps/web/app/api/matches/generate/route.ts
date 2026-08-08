import { NextResponse } from 'next/server';
import {
  rank,
  type AttachmentStyle,
  type KidsPref,
  type RelationshipGoal,
  type UserFeatures,
} from '@lumin/shared';
import { getSession } from '../../../../lib/auth';
import { getD1, mapUser } from '../../../../lib/d1';

export const dynamic = 'force-dynamic';

function toFeatures(u: NonNullable<ReturnType<typeof mapUser>>): UserFeatures {
  const bigFive =
    u.openness != null
      ? [u.openness, u.conscientiousness ?? 0.5, u.extraversion ?? 0.5, u.agreeableness ?? 0.5, u.neuroticism ?? 0.5]
      : undefined;
  return {
    userId: u.id,
    age: u.age ?? 28,
    gender: u.gender ?? 'OTHER',
    city: u.city ?? '',
    region: u.residencyRegion,
    relationshipGoal: (u.relationshipGoal as RelationshipGoal) || 'SERIOUS_DATING',
    attachment: (u.attachment as AttachmentStyle) || 'UNKNOWN',
    bigFive,
    wantsKids: (u.wantsKids as KidsPref) || 'UNKNOWN',
    communicationStyle: u.communicationStyle ?? undefined,
    mbti: u.mbti ?? undefined,
  };
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const db = await getD1();
  const meRaw = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.sub).first();
  const me = mapUser(meRaw as Record<string, unknown> | null);
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (me.status !== 'ACTIVE' && !me.isAdmin) {
    return NextResponse.json({ error: 'not_active' }, { status: 403 });
  }

  const othersRes = await db.prepare(`SELECT * FROM users WHERE status = 'ACTIVE' AND id != ?`).bind(me.id).all();
  type MappedUser = NonNullable<ReturnType<typeof mapUser>>;
  const others: MappedUser[] = (othersRes.results ?? [])
    .map((r: Record<string, unknown>) => mapUser(r))
    .filter((u: MappedUser | null): u is MappedUser => !!u);

  const ranked = rank(toFeatures(me), others.map(toFeatures), 3);
  const matches = [];
  for (const r of ranked) {
    const other = others.find((o: MappedUser) => o.id === r.userId)!;
    const [a, b] = me.id < other.id ? [me.id, other.id] : [other.id, me.id];
    const matchId = `m_${a}_${b}`.slice(0, 80);
    const narrative = `Compatibility ${Math.round(r.score * 100)}% — attachment, goals, and temperament.`;
    try {
      await db
        .prepare(
          `INSERT OR REPLACE INTO matches (id, user_a_id, user_b_id, score, breakdown_json, state, narrative)
           VALUES (?, ?, ?, ?, ?, 'DELIVERED', ?)`,
        )
        .bind(matchId, a, b, r.score, JSON.stringify(r.breakdown), narrative)
        .run();
    } catch (e) {
      console.error('[matches] upsert', e);
    }
    matches.push({
      matchId,
      userId: other.id,
      displayName: other.displayName,
      city: other.city,
      score: r.score,
      narrative,
      photoUrl: other.photoUrl,
      breakdown: r.breakdown,
    });
  }

  return NextResponse.json({ ok: true, matches });
}
