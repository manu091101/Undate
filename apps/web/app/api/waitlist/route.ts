import { NextResponse } from 'next/server';
import { getD1 } from '../../../lib/d1';
import { joinWaitlist } from '../../../lib/waitlist';

// Pitch + waitlist product: public join API (D1).
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  try {
    const db = await getD1();
    const result = await joinWaitlist(db, body);
    if (!result.ok) {
      if (result.error === 'validation') {
        return NextResponse.json({ error: result.detail }, { status: 400 });
      }
      return NextResponse.json({ error: 'persist_failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (e) {
    console.error('[waitlist] persist failed', e);
    return NextResponse.json({ error: 'persist_failed' }, { status: 500 });
  }
}
