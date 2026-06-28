import { NextResponse } from 'next/server';
import { prisma } from '@lumin/db';
import { getSession } from '../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 200 });
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      status: true,
      residencyRegion: true,
      lastActiveAt: true,
      profile: {
        select: {
          displayName: true,
          city: true,
          gender: true,
          bioShort: true,
          completionScore: true,
          curatorReady: true,
          relationshipGoal: true,
        },
      },
      personality: {
        select: { attachmentStyle: true, openness: true, conscientiousness: true, extraversion: true, agreeableness: true, neuroticism: true },
      },
    },
  });
  return NextResponse.json({ user });
}
