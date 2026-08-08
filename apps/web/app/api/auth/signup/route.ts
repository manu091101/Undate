import { NextResponse } from 'next/server';
import { SignupInput } from '@lumin/shared';
import { hashPassword, signSession, setSessionCookie } from '../../../../lib/auth';
import { getD1, newId } from '../../../../lib/d1';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = SignupInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', detail: parsed.error.flatten() }, { status: 400 });
  }
  const { email, password, displayName, gender, city, region } = parsed.data;
  const emailNorm = email.trim().toLowerCase();

  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch {
    return NextResponse.json({ error: 'password_invalid' }, { status: 400 });
  }

  // Open signup stays ACTIVE for demo/seed parity with original local flows.
  const status = 'ACTIVE';
  const id = newId('u');
  const age =
    body && typeof body === 'object' && 'dateOfBirth' in body && body.dateOfBirth
      ? Math.max(
          18,
          new Date().getFullYear() - new Date(String(body.dateOfBirth)).getFullYear(),
        )
      : null;

  try {
    const db = await getD1();
    await db
      .prepare(
        `INSERT INTO users (id, email, password_hash, display_name, status, is_admin, region, city, age, gender)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      )
      .bind(id, emailNorm, passwordHash, displayName.trim(), status, region, city ?? null, age, gender ?? null)
      .run();

    const token = await signSession({
      sub: id,
      email: emailNorm,
      status,
      region,
      isAdmin: false,
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, user: { id, email: emailNorm, status } }, { status: 201 });
  } catch (e) {
    const msg = String(e);
    if (msg.includes('UNIQUE') || msg.includes('unique')) {
      return NextResponse.json({ error: 'email_taken' }, { status: 409 });
    }
    console.error('[signup]', e);
    return NextResponse.json({ error: 'persist_failed' }, { status: 500 });
  }
}
