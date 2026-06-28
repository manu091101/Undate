// Photo upload endpoint.
//
// Accepts multipart/form-data with a `photo` File. Validates size + MIME.
// In production this writes through to S3 via @aws-sdk/client-s3 + sharp + EXIF
// strip + AI moderation (Rekognition / Bedrock + NSFW classifier) before
// surfacing the photo. For the MVP we run sharp locally and write to the
// public/uploads/ folder so Next.js serves the file directly.
//
// The Photo row tracks order and primary status. Replacing a primary photo
// demotes the previous one. moderationStatus is set APPROVED for the MVP
// (Phase 1 wires Rekognition + manual review queue).

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { prisma } from '@lumin/db';
import { getSession } from '../../../../lib/auth';
import { PHOTO_LIMITS } from '../../../../lib/photo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'bad_form' }, { status: 400 });
  const file = formData.get('photo');
  if (!(file instanceof File)) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  if (file.size > PHOTO_LIMITS.maxBytes) return NextResponse.json({ error: 'too_large' }, { status: 413 });
  if (!(PHOTO_LIMITS.acceptedMime as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });
  }

  // Per-user photo cap.
  const existing = await prisma.photo.count({ where: { userId: session.sub } });
  if (existing >= PHOTO_LIMITS.maxPerUser) {
    return NextResponse.json({ error: 'photo_limit' }, { status: 409 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // sharp: rotate by EXIF orientation (so portraits aren't sideways), then strip
  // ALL metadata (EXIF including GPS), resize, re-encode as progressive JPEG.
  let processed: Buffer;
  let width: number;
  let height: number;
  try {
    const pipeline = sharp(buf).rotate().resize({
      width: PHOTO_LIMITS.resizedMaxEdge,
      height: PHOTO_LIMITS.resizedMaxEdge,
      fit: 'inside',
      withoutEnlargement: true,
    });
    const meta = await pipeline.metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
    processed = await pipeline.jpeg({ quality: 82, progressive: true, mozjpeg: true }).toBuffer();
  } catch (e) {
    console.error('[photos.upload] sharp failed', e);
    return NextResponse.json({ error: 'image_decode_failed' }, { status: 400 });
  }

  const userDir = path.join(UPLOAD_DIR, session.sub);
  await mkdir(userDir, { recursive: true });
  const filename = `${randomUUID()}.jpg`;
  await writeFile(path.join(userDir, filename), processed);

  const s3Key = `/uploads/${session.sub}/${filename}`;

  // If this is the user's first photo, make it primary.
  const isPrimary = existing === 0;

  const photo = await prisma.photo.create({
    data: {
      userId: session.sub,
      s3Key,
      width,
      height,
      orderIdx: existing,
      isPrimary,
      moderationStatus: 'APPROVED', // MVP, Phase 1 routes through Rekognition + queue
    },
  });

  // Bump profile completion if this was first photo.
  if (isPrimary) {
    await prisma.profile.update({
      where: { userId: session.sub },
      data: { completionScore: { increment: 0 } },
    });
  }

  return NextResponse.json({ ok: true, photo: { id: photo.id, s3Key, isPrimary } }, { status: 201 });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ photos: [] }, { status: 200 });
  const photos = await prisma.photo.findMany({
    where: { userId: session.sub },
    orderBy: { orderIdx: 'asc' },
    select: { id: true, s3Key: true, isPrimary: true, orderIdx: true, moderationStatus: true, createdAt: true },
  });
  return NextResponse.json({ photos });
}
