// POST /api/matches/action — the demo-critical endpoint.
//
// Semantics (from the feature audit, mirroring Hinge's "comment + send"):
//
//   PASS    — silent decline. Creates/updates a Match row to PASSED_A/B so this
//             person never appears in future drops. No notification to recipient.
//   SAVE    — keep them in mind. Match row state SAVED_A/B. Surfaced later as
//             "Saved for later" list (Phase 1 UI).
//   CONNECT — the user is sending their OWN opener (a real first message). We
//             create a Match row with ACCEPTED_A/B, create a Conversation +
//             two ConversationParticipants, persist the opener as the first
//             Message. The recipient sees the message in their inbox; the
//             match transitions to MUTUAL when the recipient replies.
//
// Undate's contract: AI never sends. The opener body comes from the user.
// We may have suggested it (Sparkle chips) but the user pressed send.
//
// Canonical Match ordering: schema has CHECK ("userAId" < "userBId"). We
// compute who is A and who is B from the two UUIDs and pick the right state.

import { NextResponse } from 'next/server';
import { prisma } from '@lumin/db';
import { MatchActionInput } from '@lumin/shared';
import { getSession } from '../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function canonical(a: string, b: string): { userAId: string; userBId: string; iAmA: boolean } {
  return a < b
    ? { userAId: a, userBId: b, iAmA: true }
    : { userAId: b, userBId: a, iAmA: false };
}

function weekIdNow(): string {
  const d = new Date();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / 86400000;
  const week = 1 + Math.floor(diff / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = MatchActionInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', detail: parsed.error.flatten() }, { status: 400 });
  }
  const { targetUserId, action, openerText } = parsed.data;
  // Note: `anchor` (prompt or photo) is parsed but reserved for Phase-1 UI.
  if (targetUserId === session.sub) {
    return NextResponse.json({ error: 'cannot_action_self' }, { status: 400 });
  }
  if (action === 'CONNECT' && (!openerText || openerText.trim().length < 2)) {
    return NextResponse.json({ error: 'opener_required' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, status: true, residencyRegion: true, profile: { select: { displayName: true } } },
  });
  if (!target || target.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'target_not_available' }, { status: 404 });
  }

  const { userAId, userBId, iAmA } = canonical(session.sub, targetUserId);
  const weekId = weekIdNow();

  const passState = iAmA ? 'PASSED_A' : 'PASSED_B';
  const saveState = iAmA ? 'SAVED_A' : 'SAVED_B';
  const acceptState = iAmA ? 'ACCEPTED_A' : 'ACCEPTED_B';
  const otherAcceptState = iAmA ? 'ACCEPTED_B' : 'ACCEPTED_A';

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find existing Match between these two users (any week).
      const existing = await tx.match.findFirst({
        where: { userAId, userBId },
        orderBy: { proposedAt: 'desc' },
      });

      const targetState = action === 'PASS' ? passState : action === 'SAVE' ? saveState : acceptState;
      // If the other party had already ACCEPTED and we now also ACCEPT → MUTUAL.
      const becomingMutual =
        action === 'CONNECT' && existing?.state === otherAcceptState;

      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
      const newState = becomingMutual ? 'MUTUAL' : targetState;
      const newMutualAt = becomingMutual ? new Date() : existing?.mutualAt ?? null;

      const match = existing
        ? await tx.match.update({
            where: { id: existing.id },
            data: {
              state: newState,
              ...(newMutualAt ? { mutualAt: newMutualAt } : {}),
            },
          })
        : await tx.match.create({
            data: {
              userAId,
              userBId,
              weekId,
              compatibilityScore: 0,
              scoreBreakdown: {},
              state: newState,
              expiresAt,
              ...(newMutualAt ? { mutualAt: newMutualAt } : {}),
            },
          });

      // For CONNECT we open a conversation and write the opener message.
      let conversationId: string | null = null;
      if (action === 'CONNECT') {
        // Find or create the conversation tied to this match. Schema has
        // conversation.matchId @unique so this is idempotent per match.
        const existingConv = await tx.conversation.findUnique({ where: { matchId: match.id } });
        const conv =
          existingConv ??
          (await tx.conversation.create({
            data: {
              matchId: match.id,
              participants: {
                create: [
                  { userId: session.sub },
                  { userId: targetUserId },
                ],
              },
            },
          }));
        conversationId = conv.id;

        await tx.message.create({
          data: {
            conversationId: conv.id,
            senderId: session.sub,
            kind: 'TEXT',
            body: openerText!.trim(),
            aiAssisted: false, // user wrote this themselves
          },
        });
        await tx.conversation.update({
          where: { id: conv.id },
          data: { lastMessageAt: new Date() },
        });
      }

      return { match, becomingMutual, conversationId };
    });

    return NextResponse.json({
      ok: true,
      action,
      matchId: result.match.id,
      mutual: result.becomingMutual,
      conversationId: result.conversationId,
      targetName: target.profile?.displayName ?? null,
    });
  } catch (e) {
    console.error('[matches.action] failed', e);
    return NextResponse.json({ error: 'action_failed' }, { status: 500 });
  }
}
