import { NextResponse } from 'next/server';
import { prisma } from '@lumin/db';
import { requireAdmin } from '../../../../../../lib/admin';

export const runtime = 'nodejs';

// POST /api/admin/users/:id/activate
// Move a PENDING_REVIEW account → ACTIVE so it enters the matching pool.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'forbidden' }, { status: auth.status });

  const { id } = await params;
  const result = await prisma.user.updateMany({
    where: { id, status: 'PENDING_REVIEW' },
    data: { status: 'ACTIVE' },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: 'not_pending' }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
