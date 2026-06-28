'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, CardContent, Sparkle } from '@lumin/ui';
import OpenerComposer from './OpenerComposer';

interface AgenticMatch {
  userId: string;
  score: number;
  chemistry: number;
  combined: number;
  breakdown: Record<string, number>;
  debrief: string;
  sparks: string[];
  frictions: string[];
  transcript: { speaker: 'A' | 'B'; line: string }[];
  profile: {
    displayName: string;
    age: number;
    city: string;
    gender: string;
    bioShort: string | null;
    mbti: string | null;
    communicationStyle: string | null;
    primaryPhoto: string;
  };
}

interface AgenticResponse {
  ok: boolean;
  weekId: string;
  ran: number;
  matches: AgenticMatch[];
}

type Phase = 'idle' | 'running' | 'revealed' | 'empty' | 'error';
type Convo = { kind: 'none' } | { kind: 'composing' } | { kind: 'sent' } | { kind: 'mutual'; id: string };

const RING_STEPS = [
  'Spinning up your agent…',
  'Running mock dates against the pool…',
  'Filtering mismatched vibes & red flags…',
  'Scoring chemistry…',
  'Curating your introductions…',
];

export default function WeeklyMatch() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [data, setData] = useState<AgenticResponse | null>(null);
  const [step, setStep] = useState(0);
  const [idx, setIdx] = useState(0);
  const [convos, setConvos] = useState<Record<string, Convo>>({});
  const [showTranscript, setShowTranscript] = useState(false);

  async function runRing() {
    setPhase('running');
    setStep(0);
    const ticker = setInterval(() => setStep((s) => Math.min(s + 1, RING_STEPS.length - 1)), 700);
    try {
      const res = await fetch('/api/matches/agentic', { method: 'POST' });
      const j = (await res.json()) as AgenticResponse;
      await new Promise((r) => setTimeout(r, 600));
      clearInterval(ticker);
      if (!res.ok) return setPhase('error');
      setData(j);
      setIdx(0);
      setPhase(j.matches.length > 0 ? 'revealed' : 'empty');
    } catch {
      clearInterval(ticker);
      setPhase('error');
    }
  }

  function convoFor(id: string): Convo {
    return convos[id] ?? { kind: 'none' };
  }
  function setConvo(id: string, c: Convo) {
    setConvos((cur) => ({ ...cur, [id]: c }));
  }

  async function sendOpener(m: AgenticMatch, text: string) {
    const res = await fetch('/api/matches/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetUserId: m.userId, action: 'CONNECT', openerText: text }),
    });
    if (!res.ok) throw new Error('Could not send opener. Try again.');
    const j = (await res.json()) as { mutual: boolean; conversationId: string };
    setConvo(m.userId, j.mutual && j.conversationId ? { kind: 'mutual', id: j.conversationId } : { kind: 'sent' });
  }

  if (phase === 'idle') {
    return (
      <section className="mb-12 rounded-2xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 to-sparkle-500/[0.06] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-gold-700">The Agentic Matching Ring</p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-cream-50">
          Curated introductions — chosen by your agent.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-cream-50/70">
          Your AI agent runs high-speed mock dates against the pool using a real compatibility
          algorithm — attachment, values, temperament, conversation style and more — then surfaces the
          people worth meeting, with a debrief of why you clicked. The humans take it from there.
        </p>
        <Button variant="gold" size="lg" className="mt-6" onClick={runRing}>
          Run this week&apos;s ring →
        </Button>
      </section>
    );
  }

  if (phase === 'running') {
    return (
      <section className="mb-12 rounded-2xl border border-gold-500/30 bg-ink-700/50 p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/15">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
        </div>
        <p className="mt-5 font-display text-xl text-cream-50">The colosseum is running…</p>
        <p className="mt-2 text-sm text-gold-700">{RING_STEPS[step]}</p>
      </section>
    );
  }

  if (phase === 'error') {
    return (
      <section className="mb-12 rounded-2xl border border-blush-500/40 bg-blush-500/5 p-8 text-sm">
        <p className="text-cream-50/80">The ring couldn&apos;t run — finish onboarding first, then try again.</p>
        <Button variant="gold" size="sm" className="mt-4" onClick={runRing}>Try again</Button>
      </section>
    );
  }

  if (phase === 'empty' || !data || data.matches.length === 0) {
    return (
      <section className="mb-12 rounded-2xl border border-cream-50/10 p-8 text-sm text-cream-50/70">
        No one cleared the ring in your region this week. Widen your age range, or come back for the
        next drop.
      </section>
    );
  }

  const total = data.matches.length;
  const m = data.matches[idx]!;
  const convo = convoFor(m.userId);

  return (
    <>
      <section className="mb-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold-700">
              This week&apos;s introductions · {data.weekId}
            </p>
            <p className="mt-1 text-xs text-cream-50/45">
              Your agent ran {data.ran} mock {data.ran === 1 ? 'date' : 'dates'} and curated {total} for you.
            </p>
          </div>
          {/* pipeline nav */}
          <div className="flex items-center gap-2">
            <NavBtn disabled={idx === 0} onClick={() => { setIdx((i) => Math.max(0, i - 1)); setShowTranscript(false); }}>←</NavBtn>
            <span className="text-xs text-cream-50/55">{idx + 1} / {total}</span>
            <NavBtn disabled={idx === total - 1} onClick={() => { setIdx((i) => Math.min(total - 1, i + 1)); setShowTranscript(false); }}>→</NavBtn>
          </div>
        </div>

        {/* dots */}
        <div className="mt-3 flex gap-1.5">
          {data.matches.map((mm, i) => (
            <button
              key={mm.userId}
              type="button"
              aria-label={`Introduction ${i + 1}`}
              onClick={() => { setIdx(i); setShowTranscript(false); }}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i === idx ? 'bg-gold-500' : convoFor(mm.userId).kind === 'sent' || convoFor(mm.userId).kind === 'mutual' ? 'bg-sage-500/60' : 'bg-cream-50/15'
              }`}
            />
          ))}
        </div>

        <Card className="mt-4 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[5fr_6fr]">
            <div className="relative aspect-[4/5] bg-ink-700">
              <img src={m.profile.primaryPhoto} alt={m.profile.displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              {idx === 0 ? (
                <div className="absolute left-4 top-4 rounded-full bg-gold-500/90 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white">Top match</div>
              ) : null}
              <div className="absolute bottom-4 right-4 rounded-full border border-gold-500/60 bg-ink-900/80 px-3 py-1.5 text-xs font-mono text-gold-300 backdrop-blur">
                {Math.round(m.chemistry * 100)}% chemistry
              </div>
            </div>
            <CardContent className="flex flex-col gap-5 p-8">
              <div>
                <h3 className="font-display text-3xl tracking-tight text-cream-50">
                  {m.profile.displayName}, {m.profile.age}
                </h3>
                <p className="mt-1 text-sm text-cream-50/60">{m.profile.city}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.profile.mbti ? <Chip>{m.profile.mbti}</Chip> : null}
                  {m.profile.communicationStyle ? <Chip>{m.profile.communicationStyle.toLowerCase()}</Chip> : null}
                  <Chip>{Math.round(m.score * 100)}% algo fit</Chip>
                </div>
              </div>

              {m.profile.bioShort ? (
                <p className="text-sm leading-relaxed text-cream-50/85">{m.profile.bioShort}</p>
              ) : null}

              <div className="rounded-xl border border-sparkle-500/20 bg-sparkle-500/[0.06] p-4">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-sparkle-500">
                  <Sparkle size={12} /> Why your agents clicked
                </p>
                <p className="mt-2 text-sm leading-relaxed text-cream-50/85">{m.debrief}</p>
                {m.sparks.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {m.sparks.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-cream-50/80">
                        <span className="text-gold-500">✦</span> {s}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {m.frictions.length > 0 ? (
                  <p className="mt-3 text-xs text-cream-50/55">Gentle notes: {m.frictions.join(' · ')}</p>
                ) : null}
              </div>

              <button type="button" onClick={() => setShowTranscript((v) => !v)} className="text-left text-xs text-cream-50/55 hover:text-cream-50/90">
                {showTranscript ? '▾' : '▸'} Read the agents&apos; mock date
              </button>
              {showTranscript ? (
                <div className="space-y-2 rounded-lg border border-cream-50/10 bg-ink-900/40 p-4">
                  {m.transcript.map((t, i) => (
                    <p key={i} className={`text-sm leading-relaxed ${t.speaker === 'A' ? 'text-cream-50/80' : 'text-gold-300'}`}>
                      {t.line}
                    </p>
                  ))}
                </div>
              ) : null}

              {convo.kind === 'mutual' ? (
                <Link href={`/conversations/${convo.id}`} className="rounded-md border border-gold-500/50 bg-gold-500/10 px-4 py-3 text-sm text-cream-50 hover:bg-gold-500/15">
                  ✦ It&apos;s mutual — open the conversation →
                </Link>
              ) : convo.kind === 'sent' ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm italic text-cream-50/60">Opener sent to {m.profile.displayName}.</p>
                  {idx < total - 1 ? (
                    <Button variant="secondary" size="sm" onClick={() => { setIdx(idx + 1); setShowTranscript(false); }}>Next →</Button>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="gold" size="lg" onClick={() => setConvo(m.userId, { kind: 'composing' })}>
                    Start the conversation →
                  </Button>
                  {idx < total - 1 ? (
                    <button type="button" onClick={() => { setIdx(idx + 1); setShowTranscript(false); }} className="text-sm text-cream-50/55 hover:text-cream-50/90">
                      Skip for now →
                    </button>
                  ) : null}
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </section>

      {convo.kind === 'composing' ? (
        <OpenerComposer
          target={{
            displayName: m.profile.displayName,
            age: m.profile.age,
            city: m.profile.city,
            bioShort: m.profile.bioShort,
            primaryPhoto: m.profile.primaryPhoto,
          }}
          onCancel={() => setConvo(m.userId, { kind: 'none' })}
          onSend={(text) => sendOpener(m, text)}
        />
      ) : null}
    </>
  );
}

function NavBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-cream-50/15 text-cream-50/70 transition-colors hover:border-gold-500/60 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-cream-50/15 bg-cream-50/[0.04] px-2.5 py-1 text-xs text-cream-50/70">
      {children}
    </span>
  );
}
