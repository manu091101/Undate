import Link from 'next/link';
import { Button } from '@lumin/ui';
import { Logo } from '../components/Logo';
import { Reveal } from '../components/Reveal';
import { Marquee } from '../components/Marquee';
import { Polaroid, Sticker } from '../components/Collage';
import { Parallax } from '../components/Parallax';
import { Seal } from '../components/Seal';
import { RotatingText } from '../components/RotatingText';

const HERO_PHOTOS = [
  '/brand/couple-beach-dance.png',
  '/brand/couple-hands-flower.png',
  '/brand/couple-beach-run.png',
] as const;

const GALLERY = [
  { src: '/brand/couple-beach-dance.png', alt: 'Dancing at golden hour on the sand', caption: 'For the golden hours', rotate: '-5deg' },
  { src: '/brand/couple-hands-flower.png', alt: 'Holding hands, carrying a flower', caption: 'For fresh blooms', rotate: '4deg' },
  { src: '/brand/couple-alley-night.png', alt: 'Carried home through an old town alley', caption: 'For the long way home', rotate: '-3deg' },
  { src: '/brand/couple-beach-run.png', alt: 'Running barefoot along the shore', caption: 'For barefoot nights', rotate: '5deg' },
  { src: '/brand/couple-car-night.png', alt: 'Laughing together on a late drive', caption: 'For quiet nights', rotate: '-4deg' },
  { src: '/brand/couple-hands-flower.png', alt: 'A real connection', caption: 'For the real thing', rotate: '3deg' },
];

const TICKER = [
  'intentional', 'agentic', 'curated', 'no swiping', 'one match', 'verified', 'private', 'on purpose',
];

const STEPS = [
  {
    n: '01',
    title: 'Join Waitlist',
    body: 'Tell us a little about yourself and what you are looking for. Every member is considered, not automatic.',
  },
  {
    n: '02',
    title: 'Meet your matchmaker',
    body: 'A short, natural conversation by voice or text. Your agent learns how you connect and what you actually want, no forms to fill.',
  },
  {
    n: '03',
    title: 'Your agent runs the room',
    body: 'It quietly holds mock conversations with other members’ agents, feeling out chemistry and filtering the mismatches.',
  },
  {
    n: '04',
    title: 'Meet your match',
    body: 'One curated introduction, with an honest note on why the two of you clicked. Then the humans take over.',
  },
];

const STATS = [
  { k: 'One', label: 'considered introduction at a time' },
  { k: 'Zero', label: 'swipes, feeds or like counts' },
  { k: 'Real', label: 'chemistry, judged before you ever meet' },
];

const VALUES = [
  { title: 'Hand curated', body: 'Every introduction is reviewed by a real matchmaker. Our AI helps them, it never replaces them.', rotate: '-2deg' },
  { title: 'Personality first', body: 'We match on how you think, communicate and connect, on your intentions, not your filters.', rotate: '2deg' },
  { title: 'Private by design', body: 'Only your match can see your profile. No like counts, no public metrics, nothing to perform.', rotate: '-1.5deg' },
];

const FAQ = [
  {
    q: 'Is this a swiping app?',
    a: 'No. There is no endless feed, no like counts, no leaderboards. You receive one considered introduction at a time and nothing else competes for your attention.',
  },
  {
    q: 'What do you mean by AI agents?',
    a: 'After your onboarding, we build a private AI persona of you. Before any introduction, your agent has short mock conversations with other members’ agents in the background, stress-testing for dealbreakers, attachment traps and quiet red flags. Its job is subtraction: rule out who would never work, so the match you receive is one you could not have ruled out yourself.',
  },
  {
    q: 'Can you predict who I will fall for?',
    a: 'No, and we will not pretend to. The research is clear that what people say before meeting barely predicts long-term happiness, so we do not sell prophecy. What we do is remove the people you could never work with, the clashing life goals, the anxious-avoidant traps, and kill the wasted first dates. Whether you click is for the two of you to find out, in person.',
  },
  {
    q: 'Who can join?',
    a: 'Verified adults who are dating with intention. We keep the community small and trustworthy.',
  },
  {
    q: 'Is my information private?',
    a: 'Only your match sees your profile. We never sell your data, never show who viewed you, and ask the AI to read only what it needs to make a thoughtful introduction.',
  },
];

export default function MarketingPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-ink-900">
      {/* ───────────────────────── Nav ───────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-cream-50/10 bg-ink-900/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Undate home">
            <Logo height={32} />
          </Link>
          <nav className="flex items-center gap-5 text-sm sm:gap-7">
            <Link href="/journal" className="hidden text-cream-50/70 transition-colors hover:text-gold-300 sm:inline">
              Journal
            </Link>
            <Link href="/about" className="hidden text-cream-50/70 transition-colors hover:text-gold-300 sm:inline">
              How it works
            </Link>
            <Link href="/login" className="text-cream-50/70 transition-colors hover:text-gold-300">
              Sign in
            </Link>
            <Link href="/waitlist">
              <Button variant="gold" size="sm">
                Join Waitlist
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="grain relative mx-auto max-w-6xl px-6 pb-16 pt-14 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr]">
          {/* Copy */}
          <Reveal>
            <p className="mb-2 font-pixel text-2xl leading-none tracking-tight text-cream-50 sm:text-3xl">
              <span className="text-gold-400">Un</span>Swipe.{' '}
              <span className="text-gold-400">Un</span>Limit.{' '}
              <span className="text-gold-400">Un</span>Date.
            </p>
            <p className="mb-7 text-xs font-semibold uppercase tracking-[0.22em] text-cream-50/55">
              for people dating with intent.
            </p>
            <h1 className="font-display text-[3.25rem] font-light leading-[0.95] tracking-tight text-cream-50 sm:text-6xl md:text-[4.5rem]">
              Meet someone
              <br />
              worth{' '}
              <span className="relative inline-block">
                <RotatingText
                  words={['undating', 'dating', 'staying', 'waiting']}
                  className="font-pixel text-gold-300"
                  interval={2000}
                />
                <svg
                  aria-hidden
                  viewBox="0 0 300 24"
                  className="absolute -bottom-3 left-0 w-full text-gold-500"
                  preserveAspectRatio="none"
                >
                  <path d="M3 14 C 70 4, 150 22, 297 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>{' '}
              for.
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-cream-50/70">
              Your agent does the searching. You get one introduction worth{' '}
              <RotatingText
                words={['your evening.', 'knowing.', 'staying in for.', 'the long way home.']}
                className="font-display text-xl italic text-gold-300"
              />
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/waitlist">
                <Button size="xl" variant="gold">
                  Join Waitlist →
                </Button>
              </Link>
              <Link href="/about">
                <Button size="xl" variant="outline">
                  How it works
                </Button>
              </Link>
            </div>
          </Reveal>

          {/* Photo collage layover, mouse-parallax stage */}
          <Reveal delay={120} className="relative h-[26rem] sm:h-[30rem]">
            <Parallax className="absolute inset-0">
              <div data-depth="0.25" className="absolute right-2 top-44 z-0 h-40 w-40 animate-blob bg-gold-500/25 blur-2xl" />
              <div data-depth="0.9" data-rot="0deg" className="absolute right-0 top-2 z-20 animate-float-slow">
                <Polaroid
                  src={HERO_PHOTOS[0]}
                  alt="A couple at golden hour"
                  rotate="4deg"
                  imgClassName="h-52 w-64 sm:w-72"
                />
              </div>
              <div data-depth="0.45" data-rot="0deg" className="absolute left-0 top-28 z-10">
                <Polaroid
                  src={HERO_PHOTOS[1]}
                  alt="Worth meeting"
                  rotate="-7deg"
                  tape={false}
                  imgClassName="h-40 w-44"
                />
              </div>
              <div data-depth="1.3" data-rot="0deg" className="absolute bottom-0 right-12 z-30">
                <Polaroid
                  src={HERO_PHOTOS[2]}
                  alt="A real smile"
                  rotate="-3deg"
                  tape={false}
                  imgClassName="h-36 w-40"
                />
              </div>
              <div data-depth="1.6" data-rot="0deg" className="absolute -left-2 top-4 z-40">
                <Sticker rotate="-12deg" tone="purple" float>
                  ★ no swiping
                </Sticker>
              </div>
              <div data-depth="1.6" data-rot="0deg" className="absolute bottom-10 left-4 z-40">
                <Sticker rotate="8deg" tone="cream">
                  one match
                </Sticker>
              </div>
              <div data-depth="2" data-rot="0deg" className="absolute -bottom-6 left-1/2 z-40 -translate-x-1/2">
                <Seal className="animate-spin-slow text-gold-500" size={104} />
              </div>
            </Parallax>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────── Ticker ─────────────────────── */}
      <div className="border-y-2 border-cream-50/10 bg-gold-500 py-3">
        <Marquee>
          {TICKER.map((t, i) => (
            <span key={i} className="flex items-center gap-4 px-4 text-lg font-bold uppercase tracking-wider text-ink-900">
              {t}
              <span className="text-ink-900/40">✦</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* ─────────────────────── How it works ─────────────────────── */}
      <section className="bg-grid border-b border-cream-50/10">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <p className="font-pixel text-2xl text-gold-400">how it works</p>
            <h2 className="mt-2 max-w-xl font-display text-4xl font-light tracking-tight text-cream-50 md:text-5xl">
              Four unhurried steps. No swiping, no games.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 110}>
                <article className="group h-full rounded-2xl border-2 border-cream-50/10 bg-ink-700 p-7 shadow-soft transition-all duration-base ease-spring hover:-translate-y-1.5 hover:border-gold-500/50 hover:shadow-glow">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-gold-500 font-pixel text-2xl text-white shadow-[3px_3px_0_0_rgba(0,0,0,0.85)]">
                    {s.n}
                  </span>
                  <h3 className="mt-5 font-display text-xl tracking-tight text-cream-50">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-cream-50/65">{s.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── Agentic ring ─────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <Reveal>
            <Sticker rotate="-4deg" tone="lilac" className="mb-5">
              the agentic matching ring
            </Sticker>
            <h2 className="font-display text-4xl font-light tracking-tight text-cream-50 md:text-5xl">
              Your agent meets theirs, <span className="italic text-gold-300">before you ever do.</span>
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-cream-50/70">
              From your conversation we build a private AI persona of you. Each cycle it ranks everyone
              in your pool, then runs short mock conversations with the closest handful of agents to see
              who would actually hold up over dinner.
            </p>
            <p className="mt-4 max-w-md leading-relaxed text-cream-50/70">
              Its real job is subtraction: it rules out the dealbreakers, the attachment traps and the
              quiet red flags, so the one introduction you get is someone you could never have ruled out
              yourself. Then the humans take over.
            </p>
          </Reveal>

          {/* mock agent-to-agent conversation */}
          <Reveal delay={120}>
            <div className="relative rounded-2xl border-2 border-gold-500/30 bg-ink-700 p-6 shadow-glow">
              <div className="pointer-events-none absolute -right-3 -top-3">
                <Sticker rotate="10deg" tone="purple">live</Sticker>
              </div>
              <p className="mb-5 text-center font-pixel text-lg text-cream-50/55">a mock date, run by two agents</p>
              <div className="space-y-3">
                <ChatBubble side="left" who="Your agent">
                  She is secure, low-drama, big on family and depth. Wants a real partner. What is yours actually after?
                </ChatBubble>
                <ChatBubble side="right" who="Their agent">
                  Same page on kids and pace, no dealbreakers either way. They would talk through dinner.
                </ChatBubble>
                <ChatBubble side="left" who="Your agent">
                  Agreed, nothing here would blow up. Strong on attachment and values. Worth a real evening.
                </ChatBubble>
              </div>
              <p className="mt-5 flex items-center justify-center gap-2 text-center font-pixel text-xl text-gold-300">
                no dealbreakers · introduced
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────── Stats band ─────────────────────── */}
      <section className="border-y-2 border-black bg-gold-600">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 100} className="text-center">
              <p className="font-pixel text-6xl text-cream-50 md:text-7xl">{s.k}</p>
              <p className="mx-auto mt-2 max-w-[14rem] text-sm font-medium text-cream-50/85">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─────────────────────── Values ─────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <h2 className="mb-12 text-center font-display text-4xl font-light tracking-tight text-cream-50 md:text-5xl">
            Built like a friend with taste, <br className="hidden sm:block" /> not an algorithm with a quota.
          </h2>
        </Reveal>
        <div className="grid gap-8 md:grid-cols-3">
          {VALUES.map((b, i) => (
            <Reveal key={b.title} delay={i * 110}>
              <article
                className="h-full rounded-2xl border-2 border-cream-50/10 bg-ink-700 p-8 transition-transform duration-base ease-spring hover:rotate-0 hover:scale-[1.02]"
                style={{ transform: `rotate(${b.rotate})` }}
              >
                <span className="font-pixel text-3xl text-gold-400">0{i + 1}</span>
                <h3 className="mt-3 font-display text-2xl tracking-tight text-cream-50">{b.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cream-50/65">{b.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─────────────────────── Gallery collage ─────────────────────── */}
      <section className="relative overflow-hidden border-y border-cream-50/10 bg-ink-800">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <p className="font-pixel text-2xl text-gold-400">real moments</p>
            <h2 className="mt-2 max-w-xl font-display text-4xl font-light tracking-tight text-cream-50 md:text-5xl">
              The point was never the app. It was the evening that came after.
            </h2>
          </Reveal>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-2 gap-y-8 sm:gap-x-6">
            {GALLERY.map((g, i) => (
              <Reveal key={`${g.src}-${i}`} delay={(i % 3) * 90}>
                <Polaroid
                  src={g.src}
                  alt={g.alt}
                  caption={g.caption}
                  rotate={g.rotate}
                  imgClassName="h-48 w-44 sm:h-56 sm:w-52"
                  className="z-10"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── FAQ ─────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <Reveal>
          <p className="font-pixel text-2xl text-gold-400">questions, answered</p>
          <h2 className="mt-2 font-display text-4xl font-light tracking-tight text-cream-50 md:text-5xl">
            The honest FAQ.
          </h2>
        </Reveal>
        <div className="mt-12 space-y-3">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={i * 80}>
              <details className="group rounded-2xl border-2 border-cream-50/10 bg-ink-700 px-6 py-5 transition-colors open:border-gold-500/40 hover:border-gold-500/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg tracking-tight text-cream-50">
                  {f.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-gold-500/50 text-gold-400 transition-transform duration-base group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-cream-50/70">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─────────────────────── Final CTA ─────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <Reveal>
          <div className="grain relative overflow-hidden rounded-[2rem] border-2 border-black bg-gold-500 px-8 py-16 text-center shadow-retro">
            <div className="pointer-events-none absolute -left-6 top-6 animate-float-slow">
              <Sticker rotate="-14deg" tone="cream">no swiping</Sticker>
            </div>
            <div className="pointer-events-none absolute -right-3 bottom-8 animate-float">
              <Sticker rotate="12deg" tone="black">with intent</Sticker>
            </div>
            <p className="font-pixel text-4xl text-white md:text-6xl">ready to meet someone real?</p>
            <p className="mx-auto mt-5 max-w-md text-base text-white/90">
              Tell us a little about yourself and your matchmaker takes it from there.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/waitlist">
                <Button size="xl" variant="primary">
                  Join Waitlist →
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─────────────────────── Footer ─────────────────────── */}
      <footer className="border-t-2 border-cream-50/10 py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 text-center">
          <Logo height={30} />
          <p className="max-w-sm text-sm text-cream-50/50">Intentional, agentic matchmaking, where calm, considered relationships begin.</p>
          <p className="text-xs text-cream-50/40">
            © {new Date().getFullYear()} Undate ·{' '}
            <Link href="/privacy" className="transition-colors hover:text-gold-300">Privacy</Link> ·{' '}
            <Link href="/terms" className="transition-colors hover:text-gold-300">Terms</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}

function ChatBubble({
  side,
  who,
  children,
}: {
  side: 'left' | 'right';
  who: string;
  children: React.ReactNode;
}) {
  const isRight = side === 'right';
  return (
    <div className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] border-2 px-4 py-2.5 text-sm ${
          isRight
            ? 'rounded-2xl rounded-tr-sm border-black bg-gold-500 text-white'
            : 'rounded-2xl rounded-tl-sm border-cream-50/15 bg-ink-900 text-cream-50/85'
        }`}
      >
        <span className={`mb-0.5 block text-[10px] font-bold uppercase tracking-wider ${isRight ? 'text-white/70' : 'text-gold-300'}`}>
          {who}
        </span>
        {children}
      </div>
    </div>
  );
}
