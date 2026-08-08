import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../../lib/admin';
import { getD1 } from '../../../../../../lib/d1';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'forbidden' }, { status: auth.status });

  const { id } = await params;
  const db = await getD1();
  const result = await db
    .prepare(
      `UPDATE users SET status = 'ACTIVE' WHERE id = ? AND status IN ('PENDING_REVIEW', 'WAITLIST')`,
    )
    .bind(id)
    .run();
  if ((result.meta.changes ?? 0) === 0) {
    // Also allow re-activating already active for idempotency
    const existing = await db.prepare('SELECT status FROM users WHERE id = ?').bind(id).first<{ status: string }>();
    if (existing?.status === 'ACTIVE') return NextResponse.json({ ok: true });
    return NextResponse.json({ error: 'not_pending' }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
