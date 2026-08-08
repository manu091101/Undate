// Admin authorization guard. The session JWT carries an `isAdmin` claim for
// cheap edge gating, but every admin *write* re-verifies against the DB here so
// a stale token can't act after the flag is revoked.

import { getSession, type SessionClaims } from './auth';
import { getD1, mapUser } from './d1';

export type AdminCheck =
  | { ok: true; session: SessionClaims }
  | { ok: false; status: 401 | 403 };

export async function requireAdmin(): Promise<AdminCheck> {
  const session = await getSession();
  if (!session) return { ok: false, status: 401 };
  const db = await getD1();
  const raw = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.sub).first();
  const user = mapUser(raw as Record<string, unknown> | null);
  if (!user?.isAdmin) return { ok: false, status: 403 };
  return { ok: true, session };
}
