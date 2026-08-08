import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth';
import { getD1, mapUser } from '../../../../lib/d1';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  const db = await getD1();
  const raw = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.sub).first();
  const user = mapUser(raw as Record<string, unknown> | null);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      status: user.status,
      region: user.residencyRegion,
      isAdmin: user.isAdmin,
      displayName: user.displayName,
      city: user.city,
    },
  });
}
