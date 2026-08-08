import { NextResponse } from 'next/server';

/** Public member login disabled — product is waitlist-only. */
export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    { error: 'auth_disabled', message: 'Member sign-in is not available. Join the waitlist instead.' },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json({ error: 'auth_disabled' }, { status: 410 });
}
