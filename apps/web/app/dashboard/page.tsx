import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardContent, Sparkle } from '@lumin/ui';
import { prisma } from '@lumin/db';
import { requireSession } from '../../lib/auth';
import { resolvePhotoUrl, fallbackAvatar } from '../../lib/photo';
import AppNav from '../../components/AppNav';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      email: true,
      status: true,
      residencyRegion: true,
      profile: {
        select: {
          displayName: true,
          city: true,
          gender: true,
          completionScore: true,
          curatorReady: true,
          bioShort: true,
          relationshipGoal: true,
          dateOfBirth: true,
        },
      },
      personality: { select: { attachmentStyle: true, mbtiType: true, communicationStyle: true } },
      photos: { where: { isPrimary: true }, take: 1, select: { s3Key: true } },
    },
  });

  if (!user || !user.profile) redirect('/signup');

  const onboarded = (user.profile.completionScore ?? 0) >= 100;
  const photoUrl =
    resolvePhotoUrl(user.photos[0]?.s3Key) ??
    fallbackAvatar(user.profile.displayName, user.profile.gender);
  const age = user.profile.dateOfBirth
    ? Math.floor((Date.now() - user.profile.dateOfBirth.getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <>
    <AppNav />
    <main className="mx-auto max-w-3xl px-6 py-12">
      {session.isAdmin ? (
        <Link
          href="/admin"
          className="mb-8 flex items-center justify-between rounded-xl border border-gold-500/30 bg-gold-500/10 px-5 py-3 text-sm text-cream-50 hover:bg-gold-500/15"
        >
          <span className="flex items-center gap-2"><Sparkle size={14} /> Curation desk, review the waitlist &amp; activate members</span>
          <span className="text-gold-700">Open →</span>
        </Link>
      ) : null}
      {user.status === 'PENDING_REVIEW' ? (
        <div className="mb-8 rounded-xl border border-sparkle-500/30 bg-sparkle-500/[0.06] px-5 py-4 text-sm text-cream-50/80">
          <p className="font-display text-base text-cream-50">Your profile is under review.</p>
          <p className="mt-1">
            Thank you for onboarding. A curator is reviewing your profile and will activate your
            membership shortly, your matches unlock once you&apos;re approved.
          </p>
        </div>
      ) : null}
      <section className="mt-2 grid gap-8 sm:grid-cols-[160px_1fr] items-center">
        <div className="aspect-square overflow-hidden rounded-full bg-ink-700 ring-1 ring-cream-50/10">
          <img src={photoUrl} alt={user.profile.displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold-700">Welcome back</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">
            {user.profile.displayName}{age ? `, ${age}` : ''}.
          </h1>
          <p className="mt-2 text-sm text-cream-50/60">
            {user.profile.city} · {user.email} · {user.residencyRegion} region
          </p>
          {user.profile.bioShort ? (
            <p className="mt-3 text-sm text-cream-50/85 max-w-lg">{user.profile.bioShort}</p>
          ) : null}
        </div>
      </section>

      <section className="mt-12 grid gap-5 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-cream-50/55">This week</p>
            <h2 className="mt-2 font-display text-2xl tracking-tight">
              {onboarded ? 'Your matches are ready.' : 'Finish your onboarding.'}
            </h2>
            <p className="mt-2 text-sm text-cream-50/65">
              {onboarded
                ? 'Three to five curated introductions, scored by our compatibility ranker.'
                : 'We need a little more from you so we can pair you well.'}
            </p>
            <Link
              href={onboarded ? '/matches' : '/onboarding'}
              className="mt-5 inline-block rounded-md border border-gold-500/60 bg-gold-500/10 px-5 py-2.5 text-sm hover:border-gold-500 hover:bg-gold-500/15 transition-colors"
            >
              {onboarded ? 'See this week’s matches' : 'Continue onboarding'} →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-cream-50/55">Your profile</p>
            <h2 className="mt-2 font-display text-2xl tracking-tight">Show yourself.</h2>
            <p className="mt-2 text-sm text-cream-50/65">
              {user.profile.completionScore}% complete
              {user.personality?.mbtiType ? ` · ${user.personality.mbtiType}` : ''} ·{' '}
              {user.personality?.attachmentStyle ? user.personality.attachmentStyle.toLowerCase() : 'attachment pending'}
              {user.personality?.communicationStyle ? ` · ${user.personality.communicationStyle.toLowerCase()}` : ''}.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link href="/profile" className="text-sm hover:text-gold-700">View your profile →</Link>
              <Link href="/profile/edit" className="text-sm hover:text-gold-700">Edit photos &amp; details →</Link>
              <Link href="/journal" className="text-sm hover:text-gold-700">Read the Journal →</Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-12 rounded-lg border border-sparkle-500/20 bg-sparkle-500/[0.04] p-6 text-sm leading-relaxed text-cream-50/70">
        <p className="flex items-center gap-2 font-display text-lg text-cream-50">
          <Sparkle /> How the matching works
        </p>
        <p className="mt-2">
          Every match is generated by Undate&apos;s compatibility ranker, a six-axis model that
          weighs attachment-style fit, hard goal alignment, children plans, values overlap,
          emotional-stability balance, and age proximity. Each axis is anchored to peer-reviewed
          psychology. Read the full method in{' '}
          <Link href="/about" className="underline">/about</Link>.
        </p>
      </section>
    </main>
    </>
  );
}
