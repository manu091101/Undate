import { NextResponse } from 'next/server';
import { WaitlistJoinInput } from '@lumin/shared';
import { getD1, mapWaitlist, newId } from '../../../lib/d1';

// Original waitlist API — same request/response shape; D1 instead of Prisma.
export const dynamic = 'force-dynamic';

function makeReferralCode(): string {
  return 'UNDATE-' + Math.random().toString(16).slice(2, 10).toUpperCase();
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = WaitlistJoinInput.safeParse({ ...body, region: body?.region ?? 'SG' });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, city, region } = parsed.data;
  const emailNorm = email.trim().toLowerCase();
  const referralCode = makeReferralCode();

  try {
    const db = await getD1();
    const existing = await db
      .prepare('SELECT * FROM waitlist WHERE email = ? COLLATE NOCASE')
      .bind(emailNorm)
      .first();

    if (existing) {
      await db
        .prepare(
          `UPDATE waitlist SET city = COALESCE(?, city), region = COALESCE(?, region) WHERE email = ? COLLATE NOCASE`,
        )
        .bind(city ?? null, region ?? null, emailNorm)
        .run();
      const row = await db
        .prepare('SELECT * FROM waitlist WHERE email = ? COLLATE NOCASE')
        .bind(emailNorm)
        .first();
      const entry = mapWaitlist(row as Record<string, unknown>);
      return NextResponse.json({
        ok: true,
        data: {
          email: entry!.email,
          region: entry!.region,
          referralCode: entry!.referralCode,
          status: entry!.status,
        },
      });
    }

    const id = newId('w');
    await db
      .prepare(
        `INSERT INTO waitlist (id, email, city, region, referral_code, status)
         VALUES (?, ?, ?, ?, ?, 'WAITING')`,
      )
      .bind(id, emailNorm, city ?? null, region, referralCode)
      .run();

    return NextResponse.json({
      ok: true,
      data: {
        email: emailNorm,
        region,
        referralCode,
        status: 'WAITING',
      },
    });
  } catch (e) {
    console.error('[waitlist] persist failed', e);
    return NextResponse.json({ error: 'persist_failed' }, { status: 500 });
  }
}
