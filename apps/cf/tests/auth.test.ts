import { describe, expect, it } from 'vitest';
import {
  hashPassword,
  signSession,
  verifyPassword,
  verifySession,
} from '../src/lib/auth';

describe('auth crypto (shipped module)', () => {
  it('hashes and verifies passwords with PBKDF2', async () => {
    const hash = await hashPassword('undate-demo-2026');
    expect(hash.startsWith('undate$v1$')).toBe(true);
    expect(await verifyPassword('undate-demo-2026', hash)).toBe(true);
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('signs and verifies session tokens', async () => {
    const secret = 'test-secret-at-least-32-characters-long!!';
    const token = await signSession(
      {
        sub: 'u_1',
        email: 'priya@undate.local',
        status: 'ACTIVE',
        isAdmin: false,
        displayName: 'Priya',
      },
      secret,
    );
    const claims = await verifySession(token, secret);
    expect(claims).not.toBeNull();
    expect(claims!.sub).toBe('u_1');
    expect(claims!.email).toBe('priya@undate.local');
    expect(await verifySession(token, 'other-secret-that-is-also-long-enough')).toBeNull();
  });
});
