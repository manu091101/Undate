'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  'Curating your one introduction…',
];

// The weekly ritual: introductions land Sunday at 7pm.
function nextDrop(): Date {
  const now = new Date();
  const d = new Date(now);
  d.setHours(19, 0, 0, 0);
  const daysUntilSunday = (7 - d.getDay()) % 7; // 0 = Sunday
  if (daysUntilSunday === 0 && now.getTime() < d.getTime()) {
    return d; // today, before 7pm
  }
  d.setDate(d.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
  return d;
}

function Countdown() {
  const [target] = useState(nextDrop);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, target.getTime() - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const Cell = ({ v, label }: { v: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="font-display text-2xl tabular-nums text-cream-50">{String(v).padStart(2, '0')}</span>
      <span className="text-[10px] uppercase tracking-[0.14em] text-cream-50/45">{label}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-3">
      <Cell v={d} label="days" />
      <span className="text-cream-50/30">:</span>
      <Cell v={h} label="hrs" />
      <span className="text-cream-50/30">:</span>
      <Cell v={m} label="min" />
      <span className="text-cream-50/30">:</span>
      <Cell v={s} label="sec" />
    </div>
  );
}

export default function WeeklyMatch() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [data, setData] = useState<AgenticResponse | null>(null);
  const [step, setStep] = useState(0);
  const [convo, setConvo] = useState<Convo>({ kind: 'none' });
  const [showTranscript, setShowTranscript] = useState(false);

  async function runRing() {
    setPhase('running');
    setStep(0);
    const ticker = setInterval(() => setStep((s) => Math.min(s + 1, RING_STEPS.length - 1)), 700);
    try {
      const res = await fetch('/api/matches/agentic', { method: 'POST' });
      const j = (await res.json()) as AgenticResponse;
      await new Promise((r) => setTimeout(r, 700));
      clearInterval(ticker);
      if (!res.ok) return setPhase('error');
      setData(j);
      setPhase(j.matches.length > 0 ? 'revealed' : 'empty');
    } catch {
      clearInterval(ticker);
      setPhase('error');
    }
  }

  async function sendOpener(m: AgenticMatch, text: string) {
    const res = await fetch('/api/matches/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetUserId: m.userId, action: 'CONNECT', openerText: text }),
    });
    if (!res.ok) throw new Error('Could not send opener. Try again.');
    const j = (await res.json()) as { mutual: boolean; conversationId: string };
    setConvo(j.mutual && j.conversationId ? { kind: 'mutual', id: j.conversationId } : { kind: 'sent' });
  }

  if (phase === 'idle') {
    return (
      <section className="mb-12 rounded-2xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 to-sparkle-500/[0.06] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-gold-700">The Agentic Matching Ring</p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-cream-50">
          One introduction, chosen by your agent.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-cream-50/70">
          Your AI agent runs mock dates against the pool using a real compatibility algorithm,
          weighing attachment, values, temperament, conversation style and more, then surfaces the
          single person worth meeting this week. The humans take it from there.
        </p>
        <Button variant="gold" size="lg" className="mt-6" onClick={runRing}>
          Reveal this week&apos;s match →
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
        <p className="text-cream-50/80">The ring couldn&apos;t run. Finish onboarding first, then try again.</p>
        <Button variant="gold" size="sm" className="mt-4" onClick={runRing}>Try again</Button>
      </section>
    );
  }

  if (phase === 'empty' || !data || data.matches.length === 0) {
    return (
      <section className="mb-12 rounded-2xl border border-cream-50/10 p-8 text-center">
        <p className="text-sm text-cream-50/70">
          No one cleared the ring in your region this week. Your agent will keep looking.
        </p>
        <div className="mt-5 flex flex-col items-center gap-2">
          <p className="text-xs uppercase tracking-[0.16em] text-gold-700">Next introduction in</p>
          <Countdown />
        </div>
      </section>
    );
  }

  const m = data.matches[0]!;

  return (
    <>
      <section className="mb-12">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold-700">This week&apos;s introduction · {data.weekId}</p>
            <p className="mt-1 text-xs text-cream-50/45">
              Your agent ran {data.ran} mock {data.ran === 1 ? 'date' : 'dates'} and chose one.
            </p>
          </div>
          <div className="rounded-xl border border-cream-50/10 bg-ink-700/50 px-4 py-2">
            <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-cream-50/45">Next introduction in</p>
            <Countdown />
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[5fr_6fr]">
            <div className="relative aspect-[4/5] bg-ink-700">
              <img src={m.profile.primaryPhoto} alt={m.profile.displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute left-4 top-4 rounded-full bg-gold-500/90 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white">Your match</div>
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
                  ✦ It&apos;s mutual, open the conversation →
                </Link>
              ) : convo.kind === 'sent' ? (
                <p className="text-sm italic text-cream-50/60">
                  Opener sent to {m.profile.displayName}. Now it&apos;s just the two of you. Your next introduction arrives Sunday.
                </p>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="gold" size="lg" onClick={() => setConvo({ kind: 'composing' })}>
                    Start the conversation →
                  </Button>
                  <span className="text-xs text-cream-50/45">One match. Make it count.</span>
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
          onCancel={() => setConvo({ kind: 'none' })}
          onSend={(text) => sendOpener(m, text)}
        />
      ) : null}
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-cream-50/15 bg-cream-50/[0.04] px-2.5 py-1 text-xs text-cream-50/70">
      {children}
    </span>
  );
}
