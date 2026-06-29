'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@lumin/ui';

type Line = { who: 'you' | 'them'; text: string };

// The agent-to-agent "mock date" that streams in live on the dashboard.
const SCRIPT: Line[] = [
  { who: 'you', text: 'Secure, slow Sundays, wants a real partner. Yours?' },
  { who: 'them', text: 'Same energy, and lights up about family. They would talk through dinner.' },
  { who: 'you', text: 'Agreed. Strong on values. Putting them in front of each other.' },
];

/**
 * Live matching panel. Streams three agent replies one-by-one (with typing
 * dots), lands on a result, then offers to open the reveal "layover" overlay.
 */
export function DashboardLive({ matchName = 'your match' }: { matchName?: string }) {
  const [shown, setShown] = useState(0); // how many lines are visible
  const [typing, setTyping] = useState(true);
  const [open, setOpen] = useState(false); // the layover

  useEffect(() => {
    if (shown >= SCRIPT.length) {
      setTyping(false);
      return;
    }
    setTyping(true);
    const t1 = setTimeout(() => {
      setShown((n) => n + 1);
    }, 1100);
    return () => clearTimeout(t1);
  }, [shown]);

  const done = shown >= SCRIPT.length;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border-2 border-gold-500/30 bg-ink-700 p-6 shadow-glow">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-pixel text-lg text-gold-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-gold-400" />
            agents in the ring
          </p>
          <span className="text-xs uppercase tracking-wider text-cream-50/40">live</span>
        </div>

        <div className="mt-5 space-y-3">
          {SCRIPT.slice(0, shown).map((l, i) => (
            <div key={i} className={`flex ${l.who === 'them' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] animate-fade-up border-2 px-4 py-2.5 text-sm ${
                  l.who === 'them'
                    ? 'rounded-2xl rounded-tr-sm border-black bg-gold-500 text-white'
                    : 'rounded-2xl rounded-tl-sm border-cream-50/15 bg-ink-900 text-cream-50/85'
                }`}
              >
                <span className={`mb-0.5 block text-[10px] font-bold uppercase tracking-wider ${l.who === 'them' ? 'text-white/70' : 'text-gold-300'}`}>
                  {l.who === 'them' ? 'their agent' : 'your agent'}
                </span>
                {l.text}
              </div>
            </div>
          ))}
          {typing && !done ? (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-sm border-2 border-cream-50/15 bg-ink-900 px-4 py-3">
                <span className="inline-flex gap-1">
                  <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {done ? (
          <div className="mt-5 flex animate-fade-up flex-wrap items-center justify-between gap-3 border-t border-cream-50/10 pt-5">
            <p className="font-pixel text-xl text-gold-300">92% chemistry · 1 match ready</p>
            <Button variant="gold" size="sm" onClick={() => setOpen(true)}>
              Meet {matchName} →
            </Button>
          </div>
        ) : null}
      </div>

      {/* ── Layover screen ── */}
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="grain relative w-full max-w-md animate-fade-up rounded-[2rem] border-2 border-gold-500/40 bg-ink-800 p-8 text-center shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-cream-50/20 text-cream-50/60 transition-colors hover:border-gold-400 hover:text-gold-300"
            >
              ✕
            </button>
            <p className="font-pixel text-sm text-gold-300">this week</p>
            <h3 className="mt-2 font-display text-3xl italic text-cream-50">One introduction.</h3>
            <p className="mx-auto mt-3 max-w-xs text-sm text-cream-50/65">
              Your agent pressure-tested the room and found one person worth your evening.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/matches">
                <Button variant="gold" size="lg">
                  See who it is →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Dot({ delay = '0ms' }: { delay?: string }) {
  return <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-cream-50/40" style={{ animationDelay: delay }} />;
}
