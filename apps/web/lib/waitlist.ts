/**
 * Waitlist join — pure persistence helpers used by POST /api/waitlist.
 * Accepts a D1-like database so unit tests can drive the real SQL path.
 */
import { WaitlistJoinInput } from '@lumin/shared';
import type { D1Database } from './d1';
import { mapWaitlist, newId } from './d1';

export function makeReferralCode(): string {
  return 'UNDATE-' + Math.random().toString(16).slice(2, 10).toUpperCase();
}

export type WaitlistJoinResult =
  | {
      ok: true;
      data: { email: string; region: string; referralCode: string | null; status: string };
    }
  | { ok: false; error: 'validation' | 'persist_failed'; detail?: unknown };

/**
 * Validate body and insert/update a waitlist row via the shipped D1 SQL.
 */
export async function joinWaitlist(
  db: D1Database,
  body: unknown,
  opts?: { referralCode?: string; id?: string },
): Promise<WaitlistJoinResult> {
  const raw = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const parsed = WaitlistJoinInput.safeParse({ ...raw, region: raw.region ?? 'SG' });
  if (!parsed.success) {
    return { ok: false, error: 'validation', detail: parsed.error.flatten() };
  }

  const { email, city, region } = parsed.data;
  const emailNorm = email.trim().toLowerCase();
  const referralCode = opts?.referralCode ?? makeReferralCode();

  try {
    const existing = await db
      .prepare('SELECT * FROM waitlist WHERE email = ? COLLATE NOCASE')
      .bind(emailNorm)
      .first();

    if (existing) {
      await db
        .prepare(
          `UPDATE waitlist SET city = COALESCE(?, city), region = COALESCE(?, region) WHERE email = ? COLLATE NOCASE`,
        )
        .bind(city ?? null, region ?? null, emailNorm)
        .run();
      const row = await db
        .prepare('SELECT * FROM waitlist WHERE email = ? COLLATE NOCASE')
        .bind(emailNorm)
        .first();
      const entry = mapWaitlist(row as Record<string, unknown>);
      return {
        ok: true,
        data: {
          email: entry!.email,
          region: entry!.region,
          referralCode: entry!.referralCode,
          status: entry!.status,
        },
      };
    }

    const id = opts?.id ?? newId('w');
    await db
      .prepare(
        `INSERT INTO waitlist (id, email, city, region, referral_code, status)
         VALUES (?, ?, ?, ?, ?, 'WAITING')`,
      )
      .bind(id, emailNorm, city ?? null, region, referralCode)
      .run();

    return {
      ok: true,
      data: {
        email: emailNorm,
        region,
        referralCode,
        status: 'WAITING',
      },
    };
  } catch {
    return { ok: false, error: 'persist_failed' };
  }
}
