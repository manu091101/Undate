// GET /api/conversations/[id] — one conversation, every message in order.
// Marks the current user's lastReadAt to "now" on each fetch.

import { NextResponse } from 'next/server';
import { prisma } from '@lumin/db';
import { getSession } from '../../../../lib/auth';
import { resolvePhotoUrl, fallbackAvatar } from '../../../../lib/photo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;

  const conv = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      matchId: true,
      startedAt: true,
      lastMessageAt: true,
      archivedAt: true,
      match: {
        select: {
          state: true,
          mutualAt: true,
          userAId: true,
          userBId: true,
        },
      },
      participants: {
        select: {
          userId: true,
          lastReadAt: true,
          user: {
            select: {
              id: true,
              profile: { select: { displayName: true, dateOfBirth: true, city: true, gender: true, bioShort: true } },
              photos: { where: { isPrimary: true }, take: 1, select: { s3Key: true } },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 200,
        select: {
          id: true,
          senderId: true,
          body: true,
          kind: true,
          aiAssisted: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!conv.participants.some((p) => p.userId === session.sub)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Mark this view as "read" for current user (idempotent).
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: conv.id, userId: session.sub } },
    data: { lastReadAt: new Date() },
  });

  const other = conv.participants.find((p) => p.userId !== session.sub);
  const otherProfile = other?.user.profile;
  const age = otherProfile?.dateOfBirth
    ? Math.floor((Date.now() - otherProfile.dateOfBirth.getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return NextResponse.json({
    ok: true,
    id: conv.id,
    matchId: conv.matchId,
    isMutual: conv.match.state === 'MUTUAL',
    mutualAt: conv.match.mutualAt?.toISOString() ?? null,
    other: {
      userId: other?.userId ?? '',
      displayName: otherProfile?.displayName ?? 'Member',
      age,
      city: otherProfile?.city ?? '—',
      bioShort: otherProfile?.bioShort ?? null,
      photoUrl:
        resolvePhotoUrl(other?.user.photos[0]?.s3Key) ??
        fallbackAvatar(otherProfile?.displayName ?? 'm', otherProfile?.gender ?? null),
    },
    messages: conv.messages.map((m) => ({
      id: m.id,
      byMe: m.senderId === session.sub,
      body: m.body ?? '',
      kind: m.kind,
      aiAssisted: m.aiAssisted,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
