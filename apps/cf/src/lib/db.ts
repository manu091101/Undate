/**
 * D1 access helpers — real SQL against the bound DB.
 */

import type {
  AttachmentStyle,
  KidsPref,
  RelationshipGoal,
  UserFeatures,
} from './matching';

export interface Env {
  DB: D1Database;
  ASSETS?: Fetcher;
  JWT_SECRET: string;
  APP_NAME?: string;
  APP_URL?: string;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  status: string;
  is_admin: number;
  region: string;
  city: string | null;
  age: number | null;
  gender: string | null;
  relationship_goal: string | null;
  attachment: string | null;
  wants_kids: string | null;
  communication_style: string | null;
  mbti: string | null;
  openness: number | null;
  conscientiousness: number | null;
  extraversion: number | null;
  agreeableness: number | null;
  neuroticism: number | null;
  bio: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface WaitlistRow {
  id: string;
  email: string;
  city: string | null;
  region: string;
  referral_code: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export function userToFeatures(u: UserRow): UserFeatures {
  const bigFive =
    u.openness != null
      ? [
          u.openness ?? 0.5,
          u.conscientiousness ?? 0.5,
          u.extraversion ?? 0.5,
          u.agreeableness ?? 0.5,
          u.neuroticism ?? 0.5,
        ]
      : undefined;
  return {
    userId: u.id,
    age: u.age ?? 28,
    gender: u.gender ?? 'OTHER',
    city: u.city ?? '',
    region: u.region,
    relationshipGoal: (u.relationship_goal as RelationshipGoal) || 'SERIOUS_DATING',
    attachment: (u.attachment as AttachmentStyle) || 'UNKNOWN',
    bigFive,
    wantsKids: (u.wants_kids as KidsPref) || 'UNKNOWN',
    communicationStyle: u.communication_style ?? undefined,
    mbti: u.mbti ?? undefined,
  };
}

export async function getUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return (
    (await db
      .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
      .bind(email.trim().toLowerCase())
      .first<UserRow>()) ?? null
  );
}

export async function getUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return (await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>()) ?? null;
}

export async function listActiveUsers(db: D1Database): Promise<UserRow[]> {
  const res = await db.prepare("SELECT * FROM users WHERE status = 'ACTIVE'").all<UserRow>();
  return res.results ?? [];
}

export async function insertWaitlist(
  db: D1Database,
  row: { id: string; email: string; city?: string; region: string; referral_code?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = row.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'invalid_email' };
  try {
    await db
      .prepare(
        `INSERT INTO waitlist (id, email, city, region, referral_code, status)
         VALUES (?, ?, ?, ?, ?, 'WAITING')`,
      )
      .bind(row.id, email, row.city ?? null, row.region, row.referral_code ?? null)
      .run();
    return { ok: true };
  } catch (e) {
    const msg = String(e);
    if (msg.includes('UNIQUE') || msg.includes('unique')) return { ok: false, error: 'already_joined' };
    throw e;
  }
}

export async function getWaitlistByEmail(db: D1Database, email: string): Promise<WaitlistRow | null> {
  return (
    (await db
      .prepare('SELECT * FROM waitlist WHERE email = ? COLLATE NOCASE')
      .bind(email.trim().toLowerCase())
      .first<WaitlistRow>()) ?? null
  );
}

export async function listWaitlist(db: D1Database): Promise<WaitlistRow[]> {
  const res = await db
    .prepare('SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 200')
    .all<WaitlistRow>();
  return res.results ?? [];
}

export async function inviteWaitlist(db: D1Database, id: string): Promise<boolean> {
  const r = await db
    .prepare(`UPDATE waitlist SET status = 'INVITED' WHERE id = ? AND status = 'WAITING'`)
    .bind(id)
    .run();
  return (r.meta.changes ?? 0) > 0;
}

export async function activateUser(db: D1Database, id: string): Promise<boolean> {
  const r = await db
    .prepare(`UPDATE users SET status = 'ACTIVE' WHERE id = ?`)
    .bind(id)
    .run();
  return (r.meta.changes ?? 0) > 0;
}

export async function createUser(
  db: D1Database,
  input: {
    id: string;
    email: string;
    password_hash: string;
    display_name: string;
    region?: string;
    city?: string;
    age?: number;
    gender?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'invalid_email' };
  if (input.display_name.trim().length < 1) return { ok: false, error: 'name_required' };
  try {
    await db
      .prepare(
        `INSERT INTO users (id, email, password_hash, display_name, status, is_admin, region, city, age, gender)
         VALUES (?, ?, ?, ?, 'WAITLIST', 0, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        email,
        input.password_hash,
        input.display_name.trim(),
        input.region ?? 'SG',
        input.city ?? null,
        input.age ?? null,
        input.gender ?? null,
      )
      .run();
    return { ok: true };
  } catch (e) {
    const msg = String(e);
    if (msg.includes('UNIQUE') || msg.includes('unique')) return { ok: false, error: 'email_taken' };
    throw e;
  }
}

export async function upsertMatch(
  db: D1Database,
  m: {
    id: string;
    userA: string;
    userB: string;
    score: number;
    breakdown: unknown;
    narrative: string;
  },
): Promise<void> {
  const [a, b] = m.userA < m.userB ? [m.userA, m.userB] : [m.userB, m.userA];
  await db
    .prepare(
      `INSERT INTO matches (id, user_a_id, user_b_id, score, breakdown_json, state, narrative)
       VALUES (?, ?, ?, ?, ?, 'DELIVERED', ?)
       ON CONFLICT(id) DO NOTHING`,
    )
    .bind(m.id, a, b, m.score, JSON.stringify(m.breakdown), m.narrative)
    .run();
}

export async function matchesForUser(db: D1Database, userId: string) {
  const res = await db
    .prepare(
      `SELECT * FROM matches
       WHERE user_a_id = ? OR user_b_id = ?
       ORDER BY created_at DESC LIMIT 20`,
    )
    .bind(userId, userId)
    .all();
  return res.results ?? [];
}
