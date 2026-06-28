import { NextResponse } from 'next/server';
import { prisma } from '@lumin/db';
import { LoginInput } from '@lumin/shared';
import { verifyPassword, signSession, setSessionCookie } from '../../../../lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = LoginInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }
  const { email, password } = parsed.data;

  // Constant-time compare: always run bcrypt even if user doesn't exist so we
  // don't leak existence via response timing.
  const dummyHash = '$2a$12$abcdefghijklmnopqrstuOPq8O/eYkmqx7Mb3.zKqXcgFqU.lLbe6.';
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, status: true, residencyRegion: true, isAdmin: true },
  });
  const ok = await verifyPassword(password, user?.passwordHash ?? dummyHash);
  if (!user || !user.passwordHash || !ok) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }
  if (user.status === 'BANNED' || user.status === 'DELETED') {
    return NextResponse.json({ error: 'account_inactive' }, { status: 403 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

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
