// POST /api/conversations/[id]/messages — send a message in a conversation.
// Sender must be a participant. If the conversation is at the "opener sent
// but not yet mutual" state, the recipient's reply transitions the Match to
// MUTUAL automatically (this is the Hinge model: the reply IS the acceptance).

import { NextResponse } from 'next/server';
import { prisma } from '@lumin/db';
import { SendMessageInputV2 } from '@lumin/shared';
import { getSession } from '../../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id: conversationId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = SendMessageInputV2.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', detail: parsed.error.flatten() }, { status: 400 });
  }

  // Auth: I am a participant of this conversation.
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: session.sub } },
    select: { conversationId: true },
  });
  if (!participant) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { archivedAt: true, match: { select: { id: true, state: true, userAId: true, userBId: true } } },
  });
  if (!conv || conv.archivedAt) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId: session.sub,
          kind: 'TEXT',
          body: parsed.data.body,
          aiAssisted: false,
        },
        select: { id: true, createdAt: true, body: true, senderId: true, kind: true, aiAssisted: true },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt },
      });
      await tx.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: session.sub } },
        data: { lastReadAt: message.createdAt },
      });

      // Hinge model: the recipient's first reply is the "accept" signal that
      // turns the Match into MUTUAL. Only flip if not already mutual and the
      // sender is the user who did NOT originally open.
      let becomingMutual = false;
      const iAmA = conv.match.userAId === session.sub;
      const myAcceptState = iAmA ? 'ACCEPTED_A' : 'ACCEPTED_B';
      const otherAcceptState = iAmA ? 'ACCEPTED_B' : 'ACCEPTED_A';

      if (conv.match.state === otherAcceptState) {
        await tx.match.update({
          where: { id: conv.match.id },
          data: { state: 'MUTUAL', mutualAt: new Date() },
        });
        becomingMutual = true;
      } else if (conv.match.state !== 'MUTUAL' && conv.match.state !== myAcceptState) {
        // Edge: I'm initiating but no prior accept from me — set my accept.
        await tx.match.update({
          where: { id: conv.match.id },
          data: { state: myAcceptState },
        });
      }

      return { message, becomingMutual };
    });

    return NextResponse.json({
      ok: true,
      message: {
        id: result.message.id,
        body: result.message.body,
        byMe: true,
        kind: result.message.kind,
        aiAssisted: result.message.aiAssisted,
        createdAt: result.message.createdAt.toISOString(),
      },
      mutual: result.becomingMutual,
    });
  } catch (e) {
    console.error('[messages.post] failed', e);
    return NextResponse.json({ error: 'send_failed' }, { status: 500 });
  }
}
