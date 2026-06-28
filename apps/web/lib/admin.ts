// Admin authorization guard. The session JWT carries an `isAdmin` claim for
// cheap edge gating, but every admin *write* re-verifies against the DB here so
// a stale token can't act after the flag is revoked.

import { prisma } from '@lumin/db';
import { getSession, type SessionClaims } from './auth';

export type AdminCheck =
  | { ok: true; session: SessionClaims }
  | { ok: false; status: 401 | 403 };

export async function requireAdmin(): Promise<AdminCheck> {
  const session = await getSession();
  if (!session) return { ok: false, status: 401 };
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) return { ok: false, status: 403 };
  return { ok: true, session };
}
