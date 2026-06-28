// GET /api/conversations — list every conversation the current user is part
// of, with the other participant + last message preview. Sort: most recent
// activity first.

import { NextResponse } from 'next/server';
import { prisma } from '@lumin/db';
import { getSession } from '../../../lib/auth';
import { resolvePhotoUrl, fallbackAvatar } from '../../../lib/photo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: session.sub } },
      archivedAt: null,
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
    select: {
      id: true,
      matchId: true,
      lastMessageAt: true,
      startedAt: true,
      match: {
        select: {
          state: true,
          mutualAt: true,
          userAId: true,
          userBId: true,
        },
      },
      participants: {
        where: { userId: { not: session.sub } },
        select: {
          lastReadAt: true,
          user: {
            select: {
              id: true,
              profile: { select: { displayName: true, gender: true, dateOfBirth: true, city: true } },
              photos: {
                where: { isPrimary: true },
                take: 1,
                select: { s3Key: true },
              },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { body: true, senderId: true, createdAt: true, kind: true },
      },
    },
  });

  const me = await prisma.conversationParticipant.findMany({
    where: { userId: session.sub, conversationId: { in: conversations.map((c) => c.id) } },
    select: { conversationId: true, lastReadAt: true },
  });
  const myReads = new Map(me.map((r) => [r.conversationId, r.lastReadAt]));

  const items = conversations.map((c) => {
    const other = c.participants[0]?.user;
    const otherProfile = other?.profile;
    const age = otherProfile?.dateOfBirth
      ? Math.floor((Date.now() - otherProfile.dateOfBirth.getTime()) / (365.25 * 24 * 3600 * 1000))
      : null;
    const lastMsg = c.messages[0];
    const myLastRead = myReads.get(c.id);
    const hasUnread =
      !!lastMsg &&
      lastMsg.senderId !== session.sub &&
      (!myLastRead || lastMsg.createdAt > myLastRead);
    return {
      id: c.id,
      matchId: c.matchId,
      isMutual: c.match.state === 'MUTUAL',
      mutualAt: c.match.mutualAt?.toISOString() ?? null,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      hasUnread,
      other: {
        userId: other?.id ?? '',
        displayName: otherProfile?.displayName ?? 'Member',
        age,
        city: otherProfile?.city ?? '—',
        photoUrl:
          resolvePhotoUrl(other?.photos[0]?.s3Key) ??
          fallbackAvatar(otherProfile?.displayName ?? 'm', otherProfile?.gender ?? null),
      },
      preview: lastMsg
        ? {
            body: lastMsg.body ?? '',
            byMe: lastMsg.senderId === session.sub,
            kind: lastMsg.kind,
            createdAt: lastMsg.createdAt.toISOString(),
          }
        : null,
    };
  });

  return NextResponse.json({ ok: true, conversations: items });
}
