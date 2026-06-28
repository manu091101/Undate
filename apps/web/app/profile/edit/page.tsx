import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@lumin/db';
import { requireSession } from '../../../lib/auth';
import { resolvePhotoUrl } from '../../../lib/photo';
import EditForm from './EditForm';

export const dynamic = 'force-dynamic';

export default async function EditProfilePage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      profile: true,
      preferences: true,
      photos: { orderBy: { orderIdx: 'asc' }, select: { id: true, s3Key: true, isPrimary: true, orderIdx: true } },
    },
  });
  if (!user || !user.profile) redirect('/signup');

  const photos = user.photos.map((p) => ({
    id: p.id,
    url: resolvePhotoUrl(p.s3Key) ?? '',
    isPrimary: p.isPrimary,
    orderIdx: p.orderIdx,
  }));

  const initial = {
    displayName: user.profile.displayName,
    pronouns: user.profile.pronouns ?? '',
    city: user.profile.city,
    occupation: user.profile.occupation ?? '',
    company: user.profile.company ?? '',
    education: user.profile.education ?? '',
    heightCm: user.profile.heightCm ?? null,
    bioShort: user.profile.bioShort ?? '',
    bioLong: user.profile.bioLong ?? '',
    relationshipGoal: user.profile.relationshipGoal ?? 'SERIOUS_DATING',
    ageMin: user.preferences?.ageMin ?? 25,
    ageMax: user.preferences?.ageMax ?? 40,
    distanceKm: user.preferences?.distanceKm ?? 50,
    acceptedGenders: user.preferences?.acceptedGenders ?? ['WOMAN', 'MAN'],
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/profile" className="text-sm text-cream-50/60 hover:text-cream-50">
        ← Profile
      </Link>
      <h1 className="mt-8 font-display text-4xl tracking-tight">Edit your profile</h1>
      <p className="mt-3 max-w-xl text-sm text-cream-50/60">
        Changes save instantly. Photos are stripped of EXIF data on upload — your location is never
        attached to a file you share.
      </p>

      <EditForm initial={initial} initialPhotos={photos} />
    </main>
  );
}
