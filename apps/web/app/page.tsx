import Link from 'next/link';
import { Button } from '@lumin/ui';
import { Logo } from '../components/Logo';
import { Photo } from '../components/Photo';

const HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
] as const;

const GALLERY = [
  { src: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=600&q=80', alt: 'A first coffee' },
  { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80', alt: 'A long walk' },
  { src: 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=600&q=80', alt: 'Laughing over dinner' },
  { src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80', alt: 'Someone worth meeting' },
  { src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', alt: 'A quiet evening' },
  { src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80', alt: 'A real connection' },
];

const STEPS = [
  {
    n: '01',
    title: 'Request an invitation',
    body: 'Tell us a little about yourself and what you are looking for. Membership is considered, not automatic.',
  },
  {
    n: '02',
    title: 'Meet your matchmaker',
    body: 'A short, natural conversation with our AI matchmaker — no forms to fill. It listens for how you connect, not just what you like.',
  },
  {
    n: '03',
    title: 'Receive introductions',
    body: 'A small handful of curated introductions, each with an honest note on why the two of you might fit.',
  },
  {
    n: '04',
    title: 'Meet in real life',
    body: 'Start a private conversation, then meet. The product ends where the date begins — that is the point.',
  },
];

const FAQ = [
  {
    q: 'Is this a swiping app?',
    a: 'No. There is no endless feed, no like counts, no leaderboards. You receive a small number of considered introductions and nothing else competes for your attention.',
  },
  {
    q: 'How does the matchmaker work?',
    a: 'You have a relaxed conversation with an AI matchmaker that gently learns your personality, the way you communicate, and what you actually want. A human curator reviews every introduction before it reaches you.',
  },
  {
    q: 'Who can join?',
    a: 'Verified adults, 21 and over, who are dating with intention. Membership is by invitation so the community stays small and trustworthy.',
  },
  {
    q: 'Is my information private?',
    a: 'Only your match sees your profile. We never sell your data, never show who viewed you, and ask the AI to read only what it needs to make a thoughtful introduction.',
  },
];

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-ink-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-8">
        <Link href="/" aria-label="Undate home">
          <Logo height={34} />
        </Link>
        <nav className="flex items-center gap-5 text-sm sm:gap-6">
          <Link href="/journal" className="hidden text-cream-50/70 hover:text-cream-50 sm:inline">
            Journal
          </Link>
          <Link href="/about" className="hidden text-cream-50/70 hover:text-cream-50 sm:inline">
            About
          </Link>
          <Link href="/login" className="text-cream-50/70 hover:text-cream-50">
            Sign in
          </Link>
          <Link href="/waitlist">
            <Button variant="gold" size="sm">
              Request invitation
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-16 pb-20 md:grid-cols-2 md:pt-24">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold-700">
            By invitation · for people dating on purpose
          </p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-cream-50 md:text-6xl">
            Meet someone
            <br />
            worth <span className="text-gold-500">undating</span> for.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-cream-50/70">
            A quieter kind of matchmaking. A handful of curated introductions, chosen by people who
            actually pay attention — not an algorithm chasing your screen time.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/waitlist">
              <Button size="xl" variant="gold">
                Request your invitation
              </Button>
            </Link>
            <Link href="/about">
              <Button size="xl" variant="ghost">
                How it works
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-xs uppercase tracking-[0.18em] text-cream-50/45">
            By invitation only · 21+ · Verified members
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <Photo
              src={HERO_PHOTOS[0]}
              alt="A couple, at ease"
              className="col-span-2 h-64 w-full sm:h-72"
            />
            <Photo src={HERO_PHOTOS[1]} alt="Worth meeting" className="h-44 w-full sm:h-52" />
            <Photo src={HERO_PHOTOS[2]} alt="A real smile" className="h-44 w-full sm:h-52" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-cream-50/10 bg-ink-700/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl tracking-tight text-cream-50 md:text-4xl">
            How Undate works
          </h2>
          <p className="mt-3 max-w-xl text-cream-50/65">
            Four unhurried steps. No swiping, no scrolling, no games.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <article key={s.n} className="rounded-2xl border border-cream-50/10 bg-ink-900 p-7 shadow-soft">
                <span className="font-mono text-sm text-gold-500">{s.n}</span>
                <h3 className="mt-4 font-display text-xl tracking-tight text-cream-50">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cream-50/65">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-3">
        {[
          {
            title: 'Hand curated',
            body: 'Every introduction is reviewed by a real matchmaker. Our AI helps them; it never replaces them.',
          },
          {
            title: 'Personality first',
            body: 'We match on how you think, communicate, and connect — your intentions, not your filters.',
          },
          {
            title: 'Private by design',
            body: 'Only your match can see your profile. No like counts, no public metrics, nothing to perform.',
          },
        ].map((b) => (
          <article key={b.title} className="rounded-2xl border border-cream-50/10 p-8">
            <h3 className="font-display text-xl tracking-tight text-cream-50">{b.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-cream-50/65">{b.body}</p>
          </article>
        ))}
      </section>

      {/* Gallery */}
      <section className="border-t border-cream-50/10 bg-ink-700/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl tracking-tight text-cream-50 md:text-4xl">
            Real moments, real people
          </h2>
          <p className="mt-3 max-w-xl text-cream-50/65">
            The point was never the app. It was the evening that came after.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {GALLERY.map((g) => (
              <Photo key={g.src} src={g.src} alt={g.alt} className="aspect-[4/5] w-full" />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="font-display text-3xl tracking-tight text-cream-50 md:text-4xl">
          Questions, answered
        </h2>
        <div className="mt-10 divide-y divide-cream-50/10 border-y border-cream-50/10">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg tracking-tight text-cream-50">
                {f.q}
                <span className="ml-4 text-gold-500 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-cream-50/70">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-14 rounded-2xl border border-gold-500/30 bg-gold-500/10 p-8 text-center">
          <p className="font-display text-2xl tracking-tight text-cream-50">Ready to be considered?</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-cream-50/70">
            Membership is by invitation. Tell us a little about yourself and we&apos;ll be in touch.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/waitlist">
              <Button size="lg" variant="gold">
                Request your invitation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-cream-50/10 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 text-center">
          <Logo height={28} />
          <p className="text-xs text-cream-50/45">
            © {new Date().getFullYear()} Undate ·{' '}
            <Link href="/privacy" className="hover:text-cream-50/70">
              Privacy
            </Link>{' '}
            ·{' '}
            <Link href="/terms" className="hover:text-cream-50/70">
              Terms
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
