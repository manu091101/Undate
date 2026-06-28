import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@lumin/db';
import { requireAdmin } from '../../../../../../lib/admin';

export const runtime = 'nodejs';

const INVITE_TTL_DAYS = 7;

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

// POST /api/admin/waitlist/:id/invite
// Approve a WAITING entry → INVITED. Mints a single-use registration token,
// stores only its hash, and returns the raw token + signup link to the admin.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'forbidden' }, { status: auth.status });

  const { id } = await params;
  const entry = await prisma.waitlistEntry.findUnique({
    where: { id },
    select: { id: true, status: true, email: true },
  });
  if (!entry) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (entry.status === 'ACCEPTED') {
    return NextResponse.json({ error: 'already_accepted' }, { status: 409 });
  }

  const rawToken = randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: {
      status: 'INVITED',
      invitedAt: new Date(),
      expiresAt,
      inviteTokenHash: sha256(rawToken),
    },
  });

  return NextResponse.json({
    ok: true,
    email: entry.email,
    inviteToken: rawToken,
    signupUrl: `/signup?token=${rawToken}`,
    expiresAt,
  });
}
