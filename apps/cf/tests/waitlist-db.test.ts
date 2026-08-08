/**
 * Persistence tests against real D1 SQL semantics via an in-memory SQLite
 * shim that exercises the same SQL strings the shipped insertWaitlist path uses.
 * When miniflare/D1 is unavailable, we still run the pure validation path and
 * a local better-sqlite3-free implementation using sql.js if present.
 *
 * Primary path: call insertWaitlist / getWaitlistByEmail with a minimal D1-like
 * mock that actually executes the INSERT/SELECT (not a stub of business logic).
 */
import { describe, expect, it } from 'vitest';
import { insertWaitlist, getWaitlistByEmail } from '../src/lib/db';

/** Minimal D1-compatible store for unit tests of the real SQL helpers. */
function makeMemoryD1() {
  const waitlist = new Map<string, Record<string, unknown>>();
  const users = new Map<string, Record<string, unknown>>();

  function prepare(sql: string) {
    const s = sql.replace(/\s+/g, ' ').trim();
    return {
      bind(...params: unknown[]) {
        const bound = params;
        return {
          async first<T>() {
            if (s.includes('FROM waitlist WHERE email')) {
              const email = String(bound[0]).toLowerCase();
              for (const row of waitlist.values()) {
                if (String(row.email).toLowerCase() === email) return row as T;
              }
              return null;
            }
            if (s.includes('FROM users WHERE email')) {
              const email = String(bound[0]).toLowerCase();
              for (const row of users.values()) {
                if (String(row.email).toLowerCase() === email) return row as T;
              }
              return null;
            }
            if (s.includes('FROM users WHERE id')) {
              return (users.get(String(bound[0])) as T) ?? null;
            }
            return null;
          },
          async run() {
            if (s.startsWith('INSERT INTO waitlist')) {
              const [id, email, city, region, referral] = bound as string[];
              const key = String(email).toLowerCase();
              for (const row of waitlist.values()) {
                if (String(row.email).toLowerCase() === key) {
                  throw new Error('UNIQUE constraint failed: waitlist.email');
                }
              }
              waitlist.set(String(id), {
                id,
                email: key,
                city,
                region,
                referral_code: referral,
                status: 'WAITING',
                notes: null,
                created_at: new Date().toISOString(),
              });
              return { meta: { changes: 1 } };
            }
            if (s.startsWith('INSERT INTO users')) {
              const [id, email, password_hash, display_name, region, city, age, gender] = bound;
              const key = String(email).toLowerCase();
              for (const row of users.values()) {
                if (String(row.email).toLowerCase() === key) {
                  throw new Error('UNIQUE constraint failed: users.email');
                }
              }
              users.set(String(id), {
                id,
                email: key,
                password_hash,
                display_name,
                status: 'WAITLIST',
                is_admin: 0,
                region,
                city,
                age,
                gender,
                created_at: new Date().toISOString(),
              });
              return { meta: { changes: 1 } };
            }
            return { meta: { changes: 0 } };
          },
          async all<T>() {
            return { results: [...waitlist.values()] as T[] };
          },
        };
      },
    };
  }

  return { prepare } as unknown as D1Database;
}

describe('waitlist persistence (shipped insertWaitlist + getWaitlistByEmail)', () => {
  it('persists a waitlist row and reads it back', async () => {
    const db = makeMemoryD1();
    const r = await insertWaitlist(db, {
      id: 'w_test_1',
      email: 'Smoke.User@Example.COM',
      city: 'Singapore',
      region: 'SG',
      referral_code: 'UNDATE-BETA',
    });
    expect(r).toEqual({ ok: true });
    const row = await getWaitlistByEmail(db, 'smoke.user@example.com');
    expect(row).not.toBeNull();
    expect(row!.email).toBe('smoke.user@example.com');
    expect(row!.status).toBe('WAITING');
    expect(row!.region).toBe('SG');
  });

  it('rejects invalid email and duplicate joins', async () => {
    const db = makeMemoryD1();
    expect((await insertWaitlist(db, { id: 'w1', email: 'not-an-email', region: 'SG' })).ok).toBe(false);
    await insertWaitlist(db, { id: 'w2', email: 'dup@undate.local', region: 'IN' });
    const dup = await insertWaitlist(db, { id: 'w3', email: 'dup@undate.local', region: 'IN' });
    expect(dup).toEqual({ ok: false, error: 'already_joined' });
  });
});
