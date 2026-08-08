import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { joinWaitlist } from '../../../lib/waitlist';
import type { D1Database, D1Stmt } from '../../../lib/d1';

/** Minimal D1 that executes the real SQL strings from joinWaitlist. */
function makeMemoryD1(): D1Database {
  const waitlist = new Map<string, Record<string, unknown>>();

  function prepare(sql: string): D1Stmt {
    const s = sql.replace(/\s+/g, ' ').trim();
    return {
      bind(...params: unknown[]) {
        const bound = params;
        return {
          async first<T = Record<string, unknown>>() {
            if (s.includes('FROM waitlist WHERE email')) {
              const email = String(bound[0]).toLowerCase();
              for (const row of waitlist.values()) {
                if (String(row.email).toLowerCase() === email) return row as T;
              }
              return null;
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
            if (s.startsWith('UPDATE waitlist SET city')) {
              const [city, region, email] = bound as string[];
              const key = String(email).toLowerCase();
              for (const [id, row] of waitlist) {
                if (String(row.email).toLowerCase() === key) {
                  waitlist.set(id, {
                    ...row,
                    city: city ?? row.city,
                    region: region ?? row.region,
                  });
                  return { meta: { changes: 1 } };
                }
              }
              return { meta: { changes: 0 } };
            }
            return { meta: { changes: 0 } };
          },
          async all<T = Record<string, unknown>>() {
            return { results: [...waitlist.values()] as T[] };
          },
        };
      },
    };
  }

  return { prepare };
}

describe('joinWaitlist (shipped D1 path)', () => {
  it('accepts a valid SG submission and persists a row', async () => {
    const db = makeMemoryD1();
    const result = await joinWaitlist(
      db,
      { email: 'Beta@Lumin.local', city: 'Singapore', region: 'SG' },
      { referralCode: 'UNDATE-TEST0001', id: 'w_test_1' },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.email).toBe('beta@lumin.local');
    expect(result.data.status).toBe('WAITING');
    expect(result.data.region).toBe('SG');
    expect(result.data.referralCode).toBe('UNDATE-TEST0001');

    // Read-back via same SQL path
    const row = await db
      .prepare('SELECT * FROM waitlist WHERE email = ? COLLATE NOCASE')
      .bind('beta@lumin.local')
      .first();
    expect(row).not.toBeNull();
    expect(String((row as { email: string }).email)).toBe('beta@lumin.local');
  });

  it('rejects invalid email before insert', async () => {
    const db = makeMemoryD1();
    const result = await joinWaitlist(db, { email: 'not-an-email', city: 'Mumbai', region: 'IN' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('validation');
  });

  it('defaults region to SG when omitted', async () => {
    const db = makeMemoryD1();
    const result = await joinWaitlist(db, { email: 'hello@lumin.local', city: 'Singapore' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.region).toBe('SG');
  });

  it('rejects unknown region', async () => {
    const db = makeMemoryD1();
    const result = await joinWaitlist(db, { email: 'x@lumin.local', region: 'MARS' });
    expect(result.ok).toBe(false);
  });

  it('idempotent re-join updates city without duplicating', async () => {
    const db = makeMemoryD1();
    await joinWaitlist(db, { email: 'dup@undate.local', city: 'Singapore', region: 'SG' }, { id: 'w1' });
    const second = await joinWaitlist(db, { email: 'dup@undate.local', city: 'Mumbai', region: 'IN' });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.data.status).toBe('WAITING');
    const row = await db
      .prepare('SELECT * FROM waitlist WHERE email = ? COLLATE NOCASE')
      .bind('dup@undate.local')
      .first<{ city: string; region: string }>();
    expect(row?.city).toBe('Mumbai');
    expect(row?.region).toBe('IN');
  });
});

describe('public marketing auth entry (structural)', () => {
  it('home pitch has no Sign in / Sign up / login / signup CTAs', () => {
    const home = readFileSync(join(__dirname, '../../page.tsx'), 'utf8');
    expect(home).not.toMatch(/href=["']\/login["']/);
    expect(home).not.toMatch(/href=["']\/signup["']/);
    expect(home).not.toMatch(/\bSign in\b/);
    expect(home).not.toMatch(/\bSign up\b/);
    expect(home).not.toMatch(/Create account/i);
    // Waitlist CTA must remain
    expect(home).toMatch(/href=["']\/waitlist["']/);
    expect(home).toMatch(/Request access/);
  });

  it('public auth APIs are hard-disabled (410)', () => {
    const login = readFileSync(join(__dirname, '../auth/login/route.ts'), 'utf8');
    const signup = readFileSync(join(__dirname, '../auth/signup/route.ts'), 'utf8');
    expect(login).toMatch(/410/);
    expect(login).toMatch(/auth_disabled/);
    expect(signup).toMatch(/410/);
    expect(signup).toMatch(/auth_disabled/);
  });

  it('login and signup pages redirect to waitlist', () => {
    const loginPage = readFileSync(join(__dirname, '../../login/page.tsx'), 'utf8');
    const signupPage = readFileSync(join(__dirname, '../../signup/page.tsx'), 'utf8');
    expect(loginPage).toMatch(/redirect\(['"]\/waitlist['"]\)/);
    expect(signupPage).toMatch(/redirect\(['"]\/waitlist['"]\)/);
    expect(loginPage).not.toMatch(/fetch\(['"]\/api\/auth\/login/);
    expect(signupPage).not.toMatch(/fetch\(['"]\/api\/auth\/signup/);
  });
});
