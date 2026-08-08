/**
 * Cloudflare D1 access for the original Undate Next.js app (OpenNext).
 * Design/UI stays in apps/web; only persistence moves off Prisma/Postgres.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';

/** Minimal D1 surface we use (avoids depending on workers-types in tsc). */
export type D1Stmt = {
  bind: (...args: unknown[]) => D1Stmt;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  run: () => Promise<{ meta: { changes?: number } }>;
  all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>;
};
export type D1Database = {
  prepare: (sql: string) => D1Stmt;
};

export type UndateEnv = {
  DB: D1Database;
  JWT_ACCESS_SECRET?: string;
  APP_URL?: string;
};

export async function getD1(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as UndateEnv).DB;
  if (!db) throw new Error('D1 binding DB is missing');
  return db;
}

export function newId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${hex}`;
}

/** Map D1 user row → shape the original app expects (camelCase Prisma-like). */
export function mapUser(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: String(row.id),
    email: row.email != null ? String(row.email) : null,
    passwordHash: row.password_hash != null ? String(row.password_hash) : null,
    status: String(row.status ?? 'WAITLIST'),
    residencyRegion: String(row.region ?? 'SG'),
    isAdmin: Number(row.is_admin) === 1,
    displayName: String(row.display_name ?? 'Member'),
    city: row.city != null ? String(row.city) : null,
    age: row.age != null ? Number(row.age) : null,
    gender: row.gender != null ? String(row.gender) : null,
    bio: row.bio != null ? String(row.bio) : null,
    photoUrl: row.photo_url != null ? String(row.photo_url) : null,
    relationshipGoal: row.relationship_goal != null ? String(row.relationship_goal) : null,
    attachment: row.attachment != null ? String(row.attachment) : null,
    wantsKids: row.wants_kids != null ? String(row.wants_kids) : null,
    communicationStyle: row.communication_style != null ? String(row.communication_style) : null,
    mbti: row.mbti != null ? String(row.mbti) : null,
    openness: row.openness != null ? Number(row.openness) : null,
    conscientiousness: row.conscientiousness != null ? Number(row.conscientiousness) : null,
    extraversion: row.extraversion != null ? Number(row.extraversion) : null,
    agreeableness: row.agreeableness != null ? Number(row.agreeableness) : null,
    neuroticism: row.neuroticism != null ? Number(row.neuroticism) : null,
  };
}

export function mapWaitlist(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: String(row.id),
    email: String(row.email),
    city: row.city != null ? String(row.city) : null,
    region: String(row.region ?? 'SG'),
    referralCode: row.referral_code != null ? String(row.referral_code) : null,
    status: String(row.status ?? 'WAITING'),
    notes: row.notes != null ? String(row.notes) : null,
    createdAt: row.created_at != null ? String(row.created_at) : null,
  };
}
