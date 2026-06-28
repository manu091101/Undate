import { NextResponse } from 'next/server';
import { WaitlistJoinInput } from '@lumin/shared';
import { prisma } from '@lumin/db';

// Node runtime — Prisma can't run on Edge. Force this so deploys don't surprise us.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function makeReferralCode(): string {
  // 8 hex chars, plenty for uniqueness at our scale, short enough to share.
  return 'UNDATE-' + Math.random().toString(16).slice(2, 10).toUpperCase();
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = WaitlistJoinInput.safeParse({ ...body, region: body?.region ?? 'SG' });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, phoneE164, city, region, answers } = parsed.data;
  // Note: `referralCode` on input is the inviter's code; not yet resolved to a referrer here.

  try {
    const entry = await prisma.waitlistEntry.upsert({
      where: { email },
      create: {
        email,
        phoneE164,
        city,
        region,
        referralCode: makeReferralCode(),
        answers: answers ?? undefined,
      },
      update: {
        // Idempotent: an existing entry keeps its position; refresh the
        // questionnaire answers if they were re-submitted.
        phoneE164: phoneE164 ?? undefined,
        city: city ?? undefined,
        answers: answers ?? undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        email: entry.email,
        region: entry.region,
        referralCode: entry.referralCode,
        status: entry.status,
      },
    });
  } catch (e) {
    console.error('[waitlist] persist failed', e);
    return NextResponse.json({ error: 'persist_failed' }, { status: 500 });
  }
}
