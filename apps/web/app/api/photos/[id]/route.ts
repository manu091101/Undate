// Photo mutations: delete, set primary, reorder. Owner-only.

import { NextResponse } from 'next/server';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@lumin/db';
import { getSession } from '../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo || photo.userId !== session.sub) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  await prisma.photo.delete({ where: { id } });

  // Best-effort filesystem cleanup; only for local uploads, never for external URLs.
  if (photo.s3Key.startsWith('/uploads/')) {
    try {
      const filePath = path.join(process.cwd(), 'public', photo.s3Key.replace(/^\//, ''));
      await unlink(filePath);
    } catch {
      // Ignore — DB row is gone, file orphan is OK in dev
    }
  }

  // Promote the next photo to primary if we deleted the primary one.
  if (photo.isPrimary) {
    const next = await prisma.photo.findFirst({
      where: { userId: session.sub },
      orderBy: { orderIdx: 'asc' },
    });
    if (next) {
      await prisma.photo.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo || photo.userId !== session.sub) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (body && typeof body === 'object' && body.makePrimary === true) {
    await prisma.$transaction([
      prisma.photo.updateMany({ where: { userId: session.sub }, data: { isPrimary: false } }),
      prisma.photo.update({ where: { id }, data: { isPrimary: true } }),
    ]);
  }
  return NextResponse.json({ ok: true });
}
