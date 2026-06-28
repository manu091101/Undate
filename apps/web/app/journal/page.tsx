import Link from 'next/link';

export const metadata = {
  title: 'Journal',
  description:
    'The Undate Journal, essays on intentional dating, attachment, and the quiet work of finding a partner.',
};

interface Essay {
  slug: string;
  title: string;
  dek: string;
  date: string;
  readingTime: string;
}

const ESSAYS: Essay[] = [
  {
    slug: 'why-fewer-not-more',
    title: 'Why fewer, not more.',
    dek: 'The big apps optimise for endless choice. We optimise, deliberately, for a small and considered community. Here is why that is the entire point.',
    date: '2026-05-12',
    readingTime: '6 min',
  },
  {
    slug: 'the-anxious-avoidant-trap',
    title: 'The anxious-avoidant trap.',
    dek: 'One of the most-cited findings in attachment research is that anxious-avoidant pairings are the most likely to dissolve. Why dating apps quietly amplify them.',
    date: '2026-05-05',
    readingTime: '9 min',
  },
  {
    slug: 'what-the-algorithm-cannot-do',
    title: 'What the algorithm cannot do.',
    dek: 'The research is humbling: what people say they want before meeting barely predicts how a relationship turns out. So why are we still building rankers?',
    date: '2026-04-21',
    readingTime: '7 min',
  },
  {
    slug: 'a-defence-of-the-curator',
    title: 'A defence of the curator.',
    dek: 'The human matchmaker has quietly been the most loved dating product for decades. What thoughtful software can do to help, rather than replace, them.',
    date: '2026-04-07',
    readingTime: '11 min',
  },
];

export default function JournalPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-cream-50/60 hover:text-cream-50">← Undate</Link>
      <header className="mt-10">
        <p className="text-xs uppercase tracking-[0.18em] text-gold-700">The Undate Journal</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight">On intentional dating.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-cream-50/75">
          Essays from the people building Undate and from a small group of writers, therapists, and
          researchers we trust. We publish slowly. We publish when we have something to say.
        </p>
      </header>

      <section className="mt-16 space-y-8 border-t border-cream-50/10 pt-12">
        {ESSAYS.map((e) => (
          <article key={e.slug} className="group">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-cream-50/40">
              <time dateTime={e.date}>
                {new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </time>
              <span>·</span>
              <span>{e.readingTime}</span>
            </div>
            <h2 className="mt-2 font-display text-3xl tracking-tight transition-colors group-hover:text-gold-500">
              <span className="cursor-pointer">{e.title}</span>
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-cream-50/70">{e.dek}</p>
            <p className="mt-3 text-xs text-cream-50/40">Full essay coming soon.</p>
          </article>
        ))}
      </section>

      <footer className="mt-24 rounded-lg border border-cream-50/10 p-6 text-sm text-cream-50/60">
        <p>
          Want these in your inbox? Undate members receive the Journal monthly. Non-members can request
          access via the waitlist, <Link href="/waitlist" className="text-gold-700 hover:text-gold-500">join here</Link>.
        </p>
      </footer>
    </main>
  );
}
