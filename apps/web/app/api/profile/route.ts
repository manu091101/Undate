import { NextResponse } from 'next/server';
import { prisma } from '@lumin/db';
import { ProfileUpdateInput, PreferencesUpdateInput } from '@lumin/shared';
import { getSession } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UpdateBody = ProfileUpdateInput.extend({
  preferences: PreferencesUpdateInput.optional(),
});

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = UpdateBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', detail: parsed.error.flatten() }, { status: 400 });
  }
  const { preferences, ...profileFields } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // Only touch fields explicitly present in the request.
      const profileData = Object.fromEntries(
        Object.entries(profileFields).filter(([, v]) => v !== undefined),
      );
      if (Object.keys(profileData).length > 0) {
        await tx.profile.update({ where: { userId: session.sub }, data: profileData });
      }
      if (preferences) {
        if (preferences.ageMin !== undefined && preferences.ageMax !== undefined && preferences.ageMin >= preferences.ageMax) {
          throw new Error('age_range_invalid');
        }
        const prefData = Object.fromEntries(
          Object.entries(preferences).filter(([, v]) => v !== undefined),
        );
        if (Object.keys(prefData).length > 0) {
          await tx.preferences.update({ where: { userId: session.sub }, data: prefData });
        }
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === 'age_range_invalid') {
      return NextResponse.json({ error: 'age_range_invalid' }, { status: 400 });
    }
    console.error('[profile.patch] failed', e);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }
}
