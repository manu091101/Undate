import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/auth';
import { getD1, mapUser } from '../../../lib/d1';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const db = await getD1();
  const raw = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.sub).first();
  const user = mapUser(raw as Record<string, unknown> | null);
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true, user });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const db = await getD1();
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : null;
  const city = typeof body.city === 'string' ? body.city.trim() : null;
  const bio = typeof body.bioShort === 'string' ? body.bioShort : typeof body.bio === 'string' ? body.bio : null;
  await db
    .prepare(
      `UPDATE users SET
        display_name = COALESCE(?, display_name),
        city = COALESCE(?, city),
        bio = COALESCE(?, bio)
       WHERE id = ?`,
    )
    .bind(displayName, city, bio, session.sub)
    .run();
  return NextResponse.json({ ok: true });
}
