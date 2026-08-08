import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button, Card, CardContent, Sparkle } from '@lumin/ui';
import { requireSession } from '../../lib/auth';
import { fallbackAvatar } from '../../lib/photo';
import AppNav from '../../components/AppNav';
import { getD1, mapUser } from '../../lib/d1';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await requireSession();
  const db = await getD1();
  const raw = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.sub).first();
  const u = mapUser(raw as Record<string, unknown> | null);
  if (!u) redirect('/signup');

  const heroUrl = u.photoUrl ?? fallbackAvatar(u.displayName, u.gender);
  const age = u.age;

  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-end gap-4">
          <Link href="/profile/edit">
            <Button variant="gold" size="sm">
              Edit profile
            </Button>
          </Link>
        </div>

        <section className="mt-8 grid gap-8 sm:grid-cols-[260px_1fr] items-start">
          <div className="aspect-[4/5] overflow-hidden rounded-lg bg-ink-700">
            <img
              src={heroUrl}
              alt={u.displayName}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold-300">Your profile</p>
              <h1 className="mt-2 font-display text-4xl tracking-tight">
                {u.displayName}
                {age ? `, ${age}` : ''}
              </h1>
              <p className="mt-1 text-sm text-cream-50/60">
                {u.city ?? '—'} · {u.gender ?? '—'}
              </p>
            </div>
            {u.bio ? <p className="text-sm leading-relaxed text-cream-50/85">{u.bio}</p> : null}
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <Pill>{u.status}</Pill>
              <Pill>{u.residencyRegion}</Pill>
              {u.relationshipGoal ? (
                <Pill>{u.relationshipGoal.replace(/_/g, ' ').toLowerCase()}</Pill>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-5 sm:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-display text-lg tracking-tight flex items-center gap-2">
                <Sparkle size={14} /> Compatibility model
              </h3>
              <dl className="mt-4 space-y-2 text-sm">
                <Row k="Attachment style" v={u.attachment ?? '—'} />
                <Row k="Openness" v={fmt(u.openness)} />
                <Row k="Conscientiousness" v={fmt(u.conscientiousness)} />
                <Row k="Extraversion" v={fmt(u.extraversion)} />
                <Row k="Agreeableness" v={fmt(u.agreeableness)} />
                <Row k="Neuroticism" v={fmt(u.neuroticism)} />
                <Row k="MBTI" v={u.mbti ?? '—'} />
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-display text-lg tracking-tight">About</h3>
              <dl className="mt-4 space-y-2 text-sm">
                <Row k="City" v={u.city ?? '—'} />
                <Row k="Kids" v={u.wantsKids ?? '—'} />
                <Row k="Style" v={u.communicationStyle ?? '—'} />
                <Row k="Goal" v={u.relationshipGoal ?? '—'} />
              </dl>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10">
          <Card>
            <CardContent className="p-6 text-sm">
              <h3 className="font-display text-lg tracking-tight">Account</h3>
              <dl className="mt-4 space-y-2">
                <Row k="Email" v={u.email ?? '—'} />
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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 border-b border-cream-50/5 pb-2 last:border-0">
      <dt className="text-cream-50/45">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
