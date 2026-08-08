import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSession } from '../../../lib/auth';
import EditForm from './EditForm';
import { getD1, mapUser } from '../../../lib/d1';

export const dynamic = 'force-dynamic';

export default async function EditProfilePage() {
  const session = await requireSession();
  const db = await getD1();
  const raw = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.sub).first();
  const u = mapUser(raw as Record<string, unknown> | null);
  if (!u) redirect('/signup');

  const photos = u.photoUrl
    ? [{ id: 'primary', url: u.photoUrl, isPrimary: true, orderIdx: 0 }]
    : [];

  const initial = {
    displayName: u.displayName,
    pronouns: '',
    city: u.city ?? '',
    occupation: '',
    company: '',
    education: '',
    heightCm: null as number | null,
    bioShort: u.bio ?? '',
    bioLong: '',
    relationshipGoal: u.relationshipGoal ?? 'SERIOUS_DATING',
    ageMin: 25,
    ageMax: 40,
    distanceKm: 50,
    acceptedGenders: ['MAN', 'WOMAN', 'NONBINARY'] as string[],
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/profile" className="text-sm text-cream-50/60 hover:text-cream-50">
        ← Profile
      </Link>
      <h1 className="mt-6 font-display text-3xl tracking-tight">Edit profile</h1>
      <div className="mt-8">
        <EditForm initial={initial} initialPhotos={photos} />
      </div>
    </main>
  );
}
