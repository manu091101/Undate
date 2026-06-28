'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@lumin/ui';

export interface WaitlistAnswers {
  ageRange?: string;
  intention?: string;
  lookingFor?: string;
  whyJoin?: string;
}

export interface WaitlistRow {
  id: string;
  email: string;
  city: string | null;
  region: string;
  status: string;
  invitedAt: string | null;
  createdAt: string;
  answers: WaitlistAnswers | null;
}

export interface PendingUser {
  id: string;
  email: string | null;
  createdAt: string;
  displayName: string | null;
  city: string | null;
  relationshipGoal: string | null;
  attachmentStyle: string | null;
  communicationStyle: string | null;
  mbtiType: string | null;
}

function intentionLabel(i?: string): string {
  switch (i) {
    case 'SERIOUS_DATING':
      return 'Serious dating';
    case 'MARRIAGE':
      return 'Marriage';
    case 'LIFE_PARTNER':
      return 'A life partner';
    case 'EXPLORING':
      return 'Exploring';
    default:
      return ', ';
  }
}

export function AdminBoard({ waiting, pending }: { waiting: WaitlistRow[]; pending: PendingUser[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const awaiting = waiting.filter((w) => w.status === 'WAITING');
  const invited = waiting.filter((w) => w.status === 'INVITED');

  async function approve(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/waitlist/${id}/invite`, { method: 'POST' });
      const j = (await res.json()) as { ok?: boolean; signupUrl?: string };
      if (j.ok && j.signupUrl) {
        const full = `${window.location.origin}${j.signupUrl}`;
        setLinks((l) => ({ ...l, [id]: full }));
      } else {
        setError('Could not approve that entry.');
      }
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(null);
    }
  }

  async function activate(id: string) {
    setBusy(id);
    setError(null);
    try {
      await fetch(`/api/admin/users/${id}/activate`, { method: 'POST' });
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-14">
      <header>
        <h1 className="font-display text-4xl tracking-tight text-cream-50">Curation desk</h1>
        <p className="mt-2 text-sm text-cream-50/60">
          Approve invitation requests, then activate members once they&apos;ve onboarded.
        </p>
        {error ? <p className="mt-3 text-sm text-blush-500">{error}</p> : null}
      </header>

      {/* Awaiting review */}
      <section>
        <SectionTitle count={awaiting.length}>Awaiting review</SectionTitle>
        {awaiting.length === 0 ? (
          <Empty>No new requests right now.</Empty>
        ) : (
          <div className="mt-5 space-y-4">
            {awaiting.map((w) => {
              const link = links[w.id];
              return (
              <article key={w.id} className="rounded-2xl border border-cream-50/10 bg-ink-700/60 p-6 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg text-cream-50">{w.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-cream-50/45">
                      {w.city ?? 'City n/a'} · {w.answers?.ageRange ?? ', '} · {intentionLabel(w.answers?.intention)}
                    </p>
                  </div>
                  <Button
                    variant="gold"
                    size="sm"
                    disabled={busy === w.id}
                    onClick={() => approve(w.id)}
                  >
                    {busy === w.id ? 'Approving…' : 'Approve'}
                  </Button>
                </div>
                {w.answers?.lookingFor ? (
                  <p className="mt-4 text-sm text-cream-50/75">
                    <span className="text-cream-50/45">Hoping to meet, </span>
                    {w.answers.lookingFor}
                  </p>
                ) : null}
                {w.answers?.whyJoin ? (
                  <p className="mt-2 text-sm text-cream-50/75">
                    <span className="text-cream-50/45">Why, </span>
                    {w.answers.whyJoin}
                  </p>
                ) : null}
                {link ? <InviteLink url={link} /> : null}
              </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Invited */}
      <section>
        <SectionTitle count={invited.length}>Invited · awaiting registration</SectionTitle>
        {invited.length === 0 ? (
          <Empty>No outstanding invitations.</Empty>
        ) : (
          <div className="mt-5 space-y-4">
            {invited.map((w) => {
              const link = links[w.id];
              return (
              <article key={w.id} className="rounded-2xl border border-cream-50/10 p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-cream-50">{w.email}</p>
                  <span className="rounded-full bg-gold-500/15 px-3 py-1 text-xs text-gold-700">Invited</span>
                </div>
                {link ? <InviteLink url={link} /> : null}
              </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending activation */}
      <section>
        <SectionTitle count={pending.length}>Onboarded · awaiting activation</SectionTitle>
        {pending.length === 0 ? (
          <Empty>No members waiting to go live.</Empty>
        ) : (
          <div className="mt-5 space-y-4">
            {pending.map((u) => (
              <article key={u.id} className="rounded-2xl border border-cream-50/10 bg-ink-700/60 p-6 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg text-cream-50">{u.displayName ?? u.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-cream-50/45">
                      {u.city ?? 'City n/a'} · {intentionLabel(u.relationshipGoal ?? undefined)}
                      {u.mbtiType ? ` · ${u.mbtiType}` : ''}
                      {u.attachmentStyle ? ` · ${u.attachmentStyle.toLowerCase()}` : ''}
                      {u.communicationStyle ? ` · ${u.communicationStyle.toLowerCase()}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="gold"
                    size="sm"
                    disabled={busy === u.id}
                    onClick={() => activate(u.id)}
                  >
                    {busy === u.id ? 'Activating…' : 'Activate'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ children, count }: { children: React.ReactNode; count: number }) {
  return (
    <h2 className="flex items-center gap-3 font-display text-xl tracking-tight text-cream-50">
      {children}
      <span className="rounded-full bg-cream-50/[0.06] px-2.5 py-0.5 text-sm text-cream-50/60">{count}</span>
    </h2>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-sm text-cream-50/45">{children}</p>;
}

function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 rounded-xl border border-gold-500/30 bg-gold-500/10 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-gold-700">Private invitation link</p>
      <div className="mt-2 flex items-center gap-3">
        <code className="flex-1 truncate text-sm text-cream-50/80">{url}</code>
        <button
          type="button"
          className="shrink-0 rounded-md bg-gold-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-gold-700"
          onClick={() => {
            void navigator.clipboard?.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="mt-2 text-xs text-cream-50/50">
        Send this to the member. Opening it lets them create their account.
      </p>
    </div>
  );
}
