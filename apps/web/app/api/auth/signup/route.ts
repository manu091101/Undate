import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { Prisma, type RelationshipGoal } from '@prisma/client';
import { prisma } from '@lumin/db';
import { SignupInput } from '@lumin/shared';
import { hashPassword, signSession, setSessionCookie } from '../../../../lib/auth';

export const runtime = 'nodejs';

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

const GOALS: RelationshipGoal[] = ['SERIOUS_DATING', 'MARRIAGE', 'LIFE_PARTNER', 'EXPLORING'];

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = SignupInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', detail: parsed.error.flatten() }, { status: 400 });
  }
  const { email, password, displayName, dateOfBirth, gender, city, region, inviteToken } = parsed.data;

  // Gated path: a valid single-use invite token (minted by an admin approval)
  // creates a PENDING_REVIEW account. Without a token we keep open/dev signup
  // creating an ACTIVE account, so seeded/local flows are unaffected.
  let gatedEntryId: string | null = null;
  let prefillGoal: RelationshipGoal | null = null;
  if (inviteToken) {
    const entry = await prisma.waitlistEntry.findFirst({
      where: { inviteTokenHash: sha256(inviteToken), status: 'INVITED' },
      select: { id: true, expiresAt: true, answers: true },
    });
    if (!entry) {
      return NextResponse.json({ error: 'invite_invalid' }, { status: 400 });
    }
    if (entry.expiresAt && entry.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'invite_expired' }, { status: 400 });
    }
    gatedEntryId = entry.id;
    const intention = (entry.answers as { intention?: string } | null)?.intention;
    if (intention && (GOALS as string[]).includes(intention)) {
      prefillGoal = intention as RelationshipGoal;
    }
  }

  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch {
    return NextResponse.json({ error: 'password_invalid' }, { status: 400 });
  }

  const status = gatedEntryId ? 'PENDING_REVIEW' : 'ACTIVE';

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          authProvider: 'EMAIL',
          status,
          residencyRegion: region,
          profile: {
            create: {
              displayName,
              dateOfBirth,
              gender,
              city,
              relationshipGoal: prefillGoal ?? undefined,
              completionScore: 25,
            },
          },
          preferences: {
            create: {
              ageMin: 25,
              ageMax: 40,
              distanceKm: 50,
              acceptedGenders: gender === 'WOMAN' ? ['MAN'] : gender === 'MAN' ? ['WOMAN'] : ['MAN', 'WOMAN', 'NONBINARY'],
              goalsAcceptable: ['SERIOUS_DATING', 'MARRIAGE', 'LIFE_PARTNER'],
            },
          },
        },
        select: { id: true, email: true, status: true, residencyRegion: true, isAdmin: true },
      });

      if (gatedEntryId) {
        // Consume the invite: link the entry, mark ACCEPTED, burn the token.
        await tx.waitlistEntry.update({
          where: { id: gatedEntryId },
          data: {
            userId: created.id,
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            inviteTokenHash: null,
          },
        });
      }
      return created;
    });

    const token = await signSession({
      sub: user.id,
      email: user.email ?? undefined,
      status: user.status,
      region: user.residencyRegion,
      isAdmin: user.isAdmin,
    });
    await setSessionCookie(token);

    return NextResponse.json(
      { ok: true, user: { id: user.id, email: user.email, status: user.status } },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'email_in_use' }, { status: 409 });
    }
    console.error('[signup] failed', e);
    return NextResponse.json({ error: 'signup_failed' }, { status: 500 });
  }
}
