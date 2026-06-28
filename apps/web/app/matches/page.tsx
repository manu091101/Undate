'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, CardContent, Sparkle, cn } from '@lumin/ui';
import OpenerComposer from './OpenerComposer';
import MutualMatchModal from './MutualMatchModal';
import WeeklyMatch from './WeeklyMatch';
import AppNav from '../../components/AppNav';

interface Candidate {
  userId: string;
  score: number;
  breakdown: {
    attachment: number;
    goal: number;
    kids: number;
    values: number;
    neuroticismRisk: number;
    traitHarmony: number;
    commStyle: number;
    mbti: number;
    age: number;
  };
  reasons: string[];
  profile: {
    displayName: string;
    age: number;
    city: string;
    gender: string;
    bioShort: string | null;
    photos: string[];
    primaryPhoto: string;
  };
}

interface MatchResponse {
  ok: boolean;
  rankerVersion: string;
  weekId: string;
  you: { city: string; region: string };
  candidates: Candidate[];
}

type CardState =
  | { kind: 'idle' }
  | { kind: 'composing' }
  | { kind: 'passed' }
  | { kind: 'saved' }
  | { kind: 'sent' }
  | { kind: 'mutual'; conversationId: string };

const GENDER_LABEL: Record<string, string> = {
  WOMAN: 'Woman',
  MAN: 'Man',
  NONBINARY: 'Non-binary',
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: '—',
};

function tone(score: number) {
  if (score >= 0.85) return { phrase: 'Strong fit', cls: 'text-sage-500 border-sage-500/60' };
  if (score >= 0.7) return { phrase: 'Good fit', cls: 'text-gold-300 border-gold-500/60' };
  return { phrase: 'Worth a look', cls: 'text-cream-50/80 border-cream-50/30' };
}

export default function MatchesPage() {
  const [data, setData] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, CardState>>({});
  const [mutual, setMutual] = useState<{ target: Candidate['profile']; conversationId: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/matches/generate', { cache: 'no-store' });
      if (cancelled) return;
      if (res.ok) {
        setData((await res.json()) as MatchResponse);
      } else if (res.status === 400) {
        setError('Finish your onboarding first so we can match you.');
      } else {
        setError('Could not load matches. Try again in a moment.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function setCardState(userId: string, state: CardState) {
    setStates((cur) => ({ ...cur, [userId]: state }));
  }

  async function persistAction(c: Candidate, action: 'PASS' | 'SAVE') {
    setCardState(c.userId, { kind: action === 'PASS' ? 'passed' : 'saved' });
    try {
      await fetch('/api/matches/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetUserId: c.userId, action }),
      });
    } catch {
      // Best-effort; UI already updated optimistically
    }
  }

  async function sendOpener(c: Candidate, openerText: string) {
    const res = await fetch('/api/matches/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetUserId: c.userId, action: 'CONNECT', openerText }),
    });
    if (!res.ok) throw new Error('Could not send opener. Try again.');
    const json = (await res.json()) as {
      mutual: boolean;
      conversationId: string;
    };
    if (json.mutual && json.conversationId) {
      setCardState(c.userId, { kind: 'mutual', conversationId: json.conversationId });
      setMutual({ target: c.profile, conversationId: json.conversationId });
    } else {
      setCardState(c.userId, { kind: 'sent' });
    }
  }

  return (
    <>
    <AppNav />
    <main className="mx-auto max-w-4xl px-6 py-10">
      <WeeklyMatch />

      <header className="mb-10 max-w-2xl border-t border-cream-50/10 pt-12">
        <p className="text-xs uppercase tracking-[0.18em] text-gold-700">Browse the wider pool</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">The rest of this week&apos;s set.</h1>
        <p className="mt-4 text-sm leading-relaxed text-cream-50/65">
          Your one curated match is above. If you&apos;d like to see who else your agent considered,
          here&apos;s the ranked pool — tap someone, write a real opener, and Undate sends it for you,
          never on your behalf.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-blush-500/40 bg-blush-500/5 p-8 text-sm">
          <p>{error}</p>
          <Link href="/onboarding" className="mt-3 inline-block text-gold-300 hover:text-gold-500">
            Finish onboarding →
          </Link>
        </div>
      ) : null}

      {!data && !error ? <LoadingState /> : null}

      {data?.candidates.length === 0 ? (
        <div className="rounded-lg border border-cream-50/10 p-8 text-sm text-cream-50/70">
          No one matches your filters in your region this week. Try widening your age range, or
          come back Sunday for next week's drop.
        </div>
      ) : null}

      <section className="space-y-10">
        {data?.candidates.map((c, idx) => (
          <MatchCard
            key={c.userId}
            candidate={c}
            position={idx + 1}
            state={states[c.userId] ?? { kind: 'idle' }}
            onPass={() => persistAction(c, 'PASS')}
            onSave={() => persistAction(c, 'SAVE')}
            onCompose={() => setCardState(c.userId, { kind: 'composing' })}
            onCancelCompose={() => setCardState(c.userId, { kind: 'idle' })}
            onSend={(text) => sendOpener(c, text)}
          />
        ))}
      </section>

      {mutual ? (
        <MutualMatchModal
          target={mutual.target}
          conversationId={mutual.conversationId}
          onClose={() => setMutual(null)}
        />
      ) : null}

      {data && data.candidates.length > 0 ? (
        <footer className="mt-16 rounded-lg border border-cream-50/10 p-6 text-xs text-cream-50/50">
          Ranker model{' '}
          <span className="font-mono text-cream-50/70">{data.rankerVersion}</span> — rule-based,
          literature-grounded. Each explanation cites only facts the other member explicitly shared.
          Read{' '}
          <Link href="/about" className="underline">
            how this works
          </Link>
          .
        </footer>
      ) : null}
    </main>
    </>
  );
}

function MatchCard({
  candidate: c,
  position,
  state,
  onPass,
  onSave,
  onCompose,
  onCancelCompose,
  onSend,
}: {
  candidate: Candidate;
  position: number;
  state: CardState;
  onPass: () => void;
  onSave: () => void;
  onCompose: () => void;
  onCancelCompose: () => void;
  onSend: (text: string) => Promise<void>;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const photos = c.profile.photos.length > 0 ? c.profile.photos : [c.profile.primaryPhoto];
  const photo = photos[activeIdx] ?? c.profile.primaryPhoto;
  const concluded =
    state.kind === 'passed' || state.kind === 'saved' || state.kind === 'sent' || state.kind === 'mutual';
  const toneInfo = tone(c.score);

  function nextPhoto() {
    setActiveIdx((i) => Math.min(photos.length - 1, i + 1));
  }
  function prevPhoto() {
    setActiveIdx((i) => Math.max(0, i - 1));
  }

  return (
    <>
      <Card
        className={cn(
          'overflow-hidden transition-opacity duration-emphasis',
          concluded ? 'opacity-60' : '',
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-[5fr_4fr]">
          <div className="relative aspect-[4/5] bg-ink-700 select-none">
            <img
              src={photo}
              alt={c.profile.displayName}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Photo gallery dots */}
            {photos.length > 1 ? (
              <div className="absolute inset-x-4 top-4 flex gap-1.5 z-10">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Photo ${i + 1} of ${photos.length}`}
                    onClick={() => setActiveIdx(i)}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i === activeIdx ? 'bg-cream-50' : 'bg-cream-50/30 hover:bg-cream-50/55',
                    )}
                  />
                ))}
              </div>
            ) : null}
            {/* Tap zones to advance photos */}
            {photos.length > 1 ? (
              <>
                <button
                  type="button"
                  className="absolute left-0 top-12 bottom-20 w-1/3 z-0"
                  onClick={prevPhoto}
                  aria-label="Previous photo"
                />
                <button
                  type="button"
                  className="absolute right-0 top-12 bottom-20 w-1/3 z-0"
                  onClick={nextPhoto}
                  aria-label="Next photo"
                />
              </>
            ) : null}
            <div className="absolute left-4 top-4 mt-4 rounded-full bg-ink-900/70 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-cream-50/80 z-10">
              #{position} · this week
            </div>
            <div
              className={cn(
                'absolute bottom-4 right-4 rounded-full border px-3 py-1.5 text-xs font-mono backdrop-blur bg-ink-900/80 z-10',
                toneInfo.cls,
              )}
            >
              {toneInfo.phrase}
            </div>
          </div>
          <CardContent className="flex flex-col gap-6 p-8">
            <div>
              <h2 className="font-display text-3xl tracking-tight">
                {c.profile.displayName}, {c.profile.age}
              </h2>
              <p className="mt-1 text-sm text-cream-50/60">
                {c.profile.city} · {GENDER_LABEL[c.profile.gender] ?? c.profile.gender}
              </p>
            </div>

            {c.profile.bioShort ? (
              <p className="text-sm leading-relaxed text-cream-50/85">{c.profile.bioShort}</p>
            ) : null}

            <div className="rounded-lg border border-sparkle-500/20 bg-sparkle-500/[0.06] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-sparkle-500 flex items-center gap-1.5">
                <Sparkle size={12} /> Why Undate curated this match
              </p>
              <p className="mt-2 text-sm leading-relaxed text-cream-50/85">
                {c.reasons.length > 0
                  ? `Strong fit on ${c.reasons.join(', ')}.`
                  : 'Curator review pending.'}
              </p>
            </div>

            <details className="text-xs text-cream-50/60">
              <summary className="cursor-pointer list-none flex items-center gap-2 hover:text-cream-50/90">
                <span className="font-mono text-cream-50/40">▸</span> See the breakdown
              </summary>
              <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
                <BreakdownBar label="Attachment fit" value={c.breakdown.attachment} />
                <BreakdownBar label="Goal alignment" value={c.breakdown.goal} />
                <BreakdownBar label="Children plans" value={c.breakdown.kids} />
                <BreakdownBar label="Values overlap" value={c.breakdown.values} />
                <BreakdownBar label="Stress resilience" value={c.breakdown.neuroticismRisk} />
                <BreakdownBar label="Temperament" value={c.breakdown.traitHarmony} />
                <BreakdownBar label="Conversation style" value={c.breakdown.commStyle} />
                <BreakdownBar label="Personality type" value={c.breakdown.mbti} />
                <BreakdownBar label="Age proximity" value={c.breakdown.age} />
              </div>
            </details>

            {state.kind === 'mutual' ? (
              <Link
                href={`/conversations/${state.conversationId}`}
                className="rounded-md border border-gold-500/50 bg-gold-500/10 px-4 py-3 text-sm text-cream-50 hover:bg-gold-500/15 transition-colors"
              >
                ✦ Quiet match — open the conversation →
              </Link>
            ) : state.kind === 'sent' ? (
              <p className="text-sm text-cream-50/60 italic">
                Opener sent to {c.profile.displayName}. They&apos;ll see it next time they sign in.
              </p>
            ) : state.kind === 'saved' ? (
              <p className="text-sm text-cream-50/55 italic">Saved for later.</p>
            ) : state.kind === 'passed' ? (
              <p className="text-sm text-cream-50/55 italic">Passed with thanks.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onPass}
                  className="text-xs text-cream-50/50 hover:text-cream-50/80 underline-offset-4 hover:underline transition-colors"
                >
                  Pass with thanks
                </button>
                <Button variant="secondary" size="sm" onClick={onSave}>
                  Save for later
                </Button>
                <Button variant="gold" size="sm" onClick={onCompose}>
                  Write an opener →
                </Button>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {state.kind === 'composing' ? (
        <OpenerComposer
          target={c.profile}
          onCancel={onCancelCompose}
          onSend={(text) => onSend(text)}
        />
      ) : null}
    </>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span>{label}</span>
        <span className="font-mono text-cream-50/40">{Math.round(value * 100)}</span>
      </div>
      <div className="mt-1 h-1 rounded-full bg-cream-50/10 overflow-hidden">
        <div
          className="h-1 rounded-full bg-gold-500 transition-[width] duration-emphasis"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-10">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="grid grid-cols-1 md:grid-cols-[5fr_4fr] overflow-hidden rounded-lg border border-cream-50/10"
        >
          <div className="aspect-[4/5] bg-ink-700/60 animate-pulse" />
          <div className="flex flex-col gap-4 p-8">
            <div className="h-7 w-2/3 rounded bg-cream-50/10 animate-pulse" />
            <div className="h-3 w-1/3 rounded bg-cream-50/5 animate-pulse" />
            <div className="h-16 rounded bg-cream-50/5 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
