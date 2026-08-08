import { NextResponse } from 'next/server';
import { LoginInput } from '@lumin/shared';
import { verifyPassword, signSession, setSessionCookie } from '../../../../lib/auth';
import { getD1, mapUser } from '../../../../lib/d1';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = LoginInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const dummyHash = '$2a$12$abcdefghijklmnopqrstuOPq8O/eYkmqx7Mb3.zKqXcgFqU.lLbe6.';
  const db = await getD1();
  const raw = await db
    .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
    .bind(email.trim().toLowerCase())
    .first();
  const user = mapUser(raw as Record<string, unknown> | null);

  const ok = await verifyPassword(password, user?.passwordHash ?? dummyHash);
  if (!user || !user.passwordHash || !ok) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }
  if (user.status === 'BANNED' || user.status === 'DELETED') {
    return NextResponse.json({ error: 'account_inactive' }, { status: 403 });
  }

  await db
    .prepare(`UPDATE users SET last_active_at = datetime('now') WHERE id = ?`)
    .bind(user.id)
    .run();

  const token = await signSession({
    sub: user.id,
    email: user.email ?? undefined,
    status: user.status,
    region: user.residencyRegion,
    isAdmin: user.isAdmin,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
