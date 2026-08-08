import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Temporarily disabled on Cloudflare D1 cutover — UI preserved; feature re-enabled next. */
export async function GET() {
  return NextResponse.json({ error: 'not_available_on_d1_yet' }, { status: 501 });
}
export async function POST() {
  return NextResponse.json({ error: 'not_available_on_d1_yet' }, { status: 501 });
}
export async function PATCH() {
  return NextResponse.json({ error: 'not_available_on_d1_yet' }, { status: 501 });
}
export async function DELETE() {
  return NextResponse.json({ error: 'not_available_on_d1_yet' }, { status: 501 });
}
