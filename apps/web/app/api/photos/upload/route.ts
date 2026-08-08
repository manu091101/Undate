import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth';
import { getD1 } from '../../../../lib/d1';

export const dynamic = 'force-dynamic';

/**
 * Original app wrote processed images to disk via sharp.
 * On Cloudflare we accept an external HTTPS photo URL (or data URL is rejected)
 * and store it on the user row — no local filesystem.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ct = req.headers.get('content-type') || '';
  let photoUrl: string | null = null;

  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    photoUrl = typeof body.url === 'string' ? body.url : typeof body.photoUrl === 'string' ? body.photoUrl : null;
  } else {
    // Multipart: cannot persist binary to disk on Workers; ask for URL.
    return NextResponse.json(
      {
        error: 'use_url',
        message: 'Upload binary is not stored on Workers. POST JSON { "url": "https://..." } instead.',
      },
      { status: 400 },
    );
  }

  if (!photoUrl || !/^https:\/\//i.test(photoUrl)) {
    return NextResponse.json({ error: 'https_url_required' }, { status: 400 });
  }

  const db = await getD1();
  await db.prepare(`UPDATE users SET photo_url = ? WHERE id = ?`).bind(photoUrl, session.sub).run();
  return NextResponse.json({ ok: true, photo: { s3Key: photoUrl, isPrimary: true } }, { status: 201 });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ photos: [] });
  const db = await getD1();
  const row = await db.prepare('SELECT photo_url FROM users WHERE id = ?').bind(session.sub).first<{ photo_url: string | null }>();
  if (!row?.photo_url) return NextResponse.json({ photos: [] });
  return NextResponse.json({
    photos: [{ id: 'primary', s3Key: row.photo_url, isPrimary: true, orderIdx: 0 }],
  });
}
