import Link from 'next/link';
import { Logo } from '../../components/Logo';

export const metadata = { title: 'Onboarding' };

const MEASURES = [
  { k: 'Personality (OCEAN)', v: 'Openness, conscientiousness, extraversion, agreeableness, and emotional steadiness.' },
  { k: 'Personality type', v: 'A Myers-Briggs read (e.g. INFJ) mapped from how you think and connect.' },
  { k: 'Attachment & values', v: 'How you handle closeness, and the handful of things you build a life around.' },
  { k: 'Intentions', v: 'What you actually want — and whether children are part of the picture.' },
  { k: 'Conversation style', v: 'Direct, gentle, playful, reflective, or analytical — a gentle nudge, never a filter.' },
];

export default function OnboardingChooser() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <div className="flex items-center gap-3">
        <Logo height={28} />
        <span className="text-xs uppercase tracking-[0.18em] text-cream-50/50">Your onboarding</span>
      </div>

      <h1 className="mt-8 font-display text-4xl tracking-tight text-cream-50">
        Let&apos;s get to know you — properly.
      </h1>
      <p className="mt-4 max-w-xl text-cream-50/70">
        Instead of a form, you&apos;ll have one short, natural conversation with your Undate
        matchmaker. It never asks you to rate yourself — it simply listens, the way a good friend
        would, and quietly builds your profile.
      </p>

      {/* What the matchmaker explores — made evident up front */}
      <section className="mt-10 rounded-2xl border border-cream-50/10 bg-ink-700/50 p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-gold-700">What your matchmaker explores</p>
        <ul className="mt-4 space-y-3">
          {MEASURES.map((m) => (
            <li key={m.k} className="flex gap-3 text-sm">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
              <span>
                <span className="font-medium text-cream-50">{m.k}.</span>{' '}
                <span className="text-cream-50/65">{m.v}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-cream-50/45">
          Private by design: we never infer or store religion, health, ethnicity, or orientation —
          and the AI can&apos;t be talked into a particular score.
        </p>
      </section>

      {/* Two ways in */}
      <h2 className="mt-12 font-display text-2xl tracking-tight text-cream-50">Choose how you&apos;d like to do it</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Link
          href="/onboarding/voice"
          className="group rounded-2xl border border-cream-50/10 bg-ink-900 p-7 shadow-soft transition-colors hover:border-gold-500/50"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gold-500/15 text-gold-700">
            <MicIcon />
          </span>
          <h3 className="mt-5 font-display text-xl tracking-tight text-cream-50">Talk it out</h3>
          <p className="mt-2 text-sm leading-relaxed text-cream-50/65">
            A ~5-minute voice chat — like ranting to a friend. Speak your answers; your matchmaker
            talks back. Most people open up more this way.
          </p>
          <span className="mt-4 inline-block text-sm text-gold-700 group-hover:text-gold-500">Start the voice chat →</span>
        </Link>

        <Link
          href="/onboarding/chat"
          className="group rounded-2xl border border-cream-50/10 bg-ink-900 p-7 shadow-soft transition-colors hover:border-gold-500/50"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gold-500/15 text-gold-700">
            <ChatIcon />
          </span>
          <h3 className="mt-5 font-display text-xl tracking-tight text-cream-50">Type it out</h3>
          <p className="mt-2 text-sm leading-relaxed text-cream-50/65">
            Prefer to write? Have the same conversation by text, at your own pace, whenever you like.
          </p>
          <span className="mt-4 inline-block text-sm text-gold-700 group-hover:text-gold-500">Start the chat →</span>
        </Link>
      </div>

      <p className="mt-8 text-center text-xs text-cream-50/45">
        In a hurry?{' '}
        <Link href="/onboarding/classic" className="text-cream-50/70 underline hover:text-cream-50">
          Use the quick form instead
        </Link>
        .
      </p>
    </main>
  );
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
