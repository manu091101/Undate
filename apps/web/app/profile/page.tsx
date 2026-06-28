import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button, Card, CardContent, Sparkle } from '@lumin/ui';
import { prisma } from '@lumin/db';
import { requireSession } from '../../lib/auth';
import { resolvePhotoUrl, fallbackAvatar } from '../../lib/photo';
import AppNav from '../../components/AppNav';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      status: true,
      residencyRegion: true,
      createdAt: true,
      profile: true,
      personality: true,
      preferences: true,
      photos: { orderBy: { orderIdx: 'asc' }, select: { id: true, s3Key: true, isPrimary: true } },
    },
  });
  if (!user) redirect('/signup');

  const photos = user.photos.map((p) => resolvePhotoUrl(p.s3Key)).filter((u): u is string => !!u);
  const heroUrl = photos[0] ?? fallbackAvatar(user.profile?.displayName ?? '', user.profile?.gender ?? null);
  const age = user.profile?.dateOfBirth
    ? Math.floor((Date.now() - user.profile.dateOfBirth.getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <>
    <AppNav />
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-end gap-4">
        <Link href="/profile/edit"><Button variant="gold" size="sm">Edit profile</Button></Link>
      </div>

      <section className="mt-8 grid gap-8 sm:grid-cols-[260px_1fr] items-start">
        <div className="aspect-[4/5] overflow-hidden rounded-lg bg-ink-700">
          <img src={heroUrl} alt={user.profile?.displayName ?? 'You'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold-300">Your profile</p>
            <h1 className="mt-2 font-display text-4xl tracking-tight">
              {user.profile?.displayName ?? '—'}{age ? `, ${age}` : ''}
            </h1>
            <p className="mt-1 text-sm text-cream-50/60">
              {user.profile?.city ?? '—'} · {user.profile?.gender ?? '—'}
            </p>
          </div>
          {user.profile?.bioShort ? (
            <p className="text-sm leading-relaxed text-cream-50/85">{user.profile.bioShort}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <Pill>{user.status}</Pill>
            <Pill>{user.residencyRegion}</Pill>
            {user.profile?.relationshipGoal ? <Pill>{user.profile.relationshipGoal.replace('_', ' ').toLowerCase()}</Pill> : null}
            {user.profile?.completionScore != null ? <Pill>{user.profile.completionScore}% complete</Pill> : null}
          </div>
        </div>
      </section>

      {photos.length > 1 ? (
        <section className="mt-10">
          <h2 className="font-display text-lg tracking-tight">More photos</h2>
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
            {photos.slice(1).map((url, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-md bg-ink-700">
                <img src={url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10 grid gap-5 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-lg tracking-tight flex items-center gap-2"><Sparkle size={14}/> Compatibility model</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <Row k="Attachment style" v={user.personality?.attachmentStyle ?? '—'} />
              <Row k="Openness" v={fmt(user.personality?.openness)} />
              <Row k="Conscientiousness" v={fmt(user.personality?.conscientiousness)} />
              <Row k="Extraversion" v={fmt(user.personality?.extraversion)} />
              <Row k="Agreeableness" v={fmt(user.personality?.agreeableness)} />
              <Row k="Neuroticism" v={fmt(user.personality?.neuroticism)} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-lg tracking-tight">Preferences</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <Row k="Age range" v={user.preferences ? `${user.preferences.ageMin}–${user.preferences.ageMax}` : '—'} />
              <Row k="Genders" v={user.preferences?.acceptedGenders.join(', ') ?? '—'} />
              <Row k="Distance" v={user.preferences ? `${user.preferences.distanceKm} km` : '—'} />
              <Row k="Cross-region" v={user.preferences?.acceptsCrossRegion ? 'Yes' : 'No'} />
            </dl>
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <Card>
          <CardContent className="p-6 text-sm">
            <h3 className="font-display text-lg tracking-tight">Account</h3>
            <dl className="mt-4 space-y-2">
              <Row k="Email" v={user.email ?? '—'} />
              <Row k="Created" v={user.createdAt.toISOString().slice(0, 10)} />
            </dl>
          </CardContent>
        </Card>
      </section>
    </main>
    </>
  );
}

function fmt(v?: number | null) {
  return v === null || v === undefined ? '—' : v.toFixed(2);
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-cream-50/15 px-3 py-1 text-xs text-cream-50/70">
      {children}
    </span>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 border-b border-cream-50/5 pb-2 last:border-0">
      <dt className="text-cream-50/45">{k}</dt>
      <dd className={mono ? 'font-mono text-xs' : ''}>{v}</dd>
    </div>
  );
}
