import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../../lib/admin';
import { getD1, mapWaitlist } from '../../../../../../lib/d1';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'forbidden' }, { status: auth.status });

  const { id } = await params;
  const db = await getD1();
  const raw = await db.prepare('SELECT * FROM waitlist WHERE id = ?').bind(id).first();
  const entry = mapWaitlist(raw as Record<string, unknown> | null);
  if (!entry) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (entry.status === 'ACCEPTED') {
    return NextResponse.json({ error: 'already_accepted' }, { status: 409 });
  }

  const rawToken = randomBytes(24).toString('hex');
  await db
    .prepare(`UPDATE waitlist SET status = 'INVITED', notes = ? WHERE id = ?`)
    .bind(`invite:${rawToken.slice(0, 12)}`, id)
    .run();

  return NextResponse.json({
    ok: true,
    email: entry.email,
    inviteToken: rawToken,
    signupUrl: `/signup?token=${rawToken}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
}
