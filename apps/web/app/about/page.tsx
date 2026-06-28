import Link from 'next/link';
import { Button } from '@lumin/ui';

export const metadata = {
  title: 'About',
  description: 'What Undate is, and what it deliberately is not.',
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-cream-50/60 hover:text-cream-50">← Undate</Link>
      <h1 className="mt-10 font-display text-5xl tracking-tight">About Undate.</h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-cream-50/80">
        Undate is a premium, intentional matchmaking platform for adults who are tired of swiping. We
        do not promise more. We promise <em>fewer</em>, better introductions, a small handful,
        drawn from a curator-reviewed pool of verified members.
      </p>

      <section className="mt-14 space-y-10">
        <Block
          title="What we are."
          body="A small, deliberately slow product. Onboarding takes time. Matches arrive on a schedule. Conversations are private and unmetricated. Our priority is helping you have a small number of real-life dates with people who could realistically be your partner, not maximising your screen time."
        />
        <Block
          title="What we are not."
          body="We are not a swipe app. We do not show you the number of people who liked your profile. We do not gamify your loneliness. We do not pretend an algorithm can predict who you'll fall in love with, pre-meeting data explains almost none of long-term relationship satisfaction in the research. What our model can do is filter for hard incompatibilities (children plans, life goals, attachment-style traps) so the curator's time is well spent."
        />
        <Block
          title="Who we are not for."
          body="People in a hurry. Users looking for a high volume of casual matches. Anyone under 21. Anyone unwilling to be verified."
        />
      </section>

      <section className="mt-20 rounded-lg border border-gold-500/30 bg-gold-500/5 p-8">
        <p className="font-display text-2xl tracking-tight">Ready to be considered?</p>
        <p className="mt-3 text-sm text-cream-50/70">
          Membership is by invitation. Tell us a little about yourself and we&apos;ll be in touch.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/waitlist"><Button variant="gold">Request your invitation</Button></Link>
          <Link href="/journal"><Button variant="ghost">Read the Journal</Button></Link>
        </div>
      </section>
    </main>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <article>
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-cream-50/75">{body}</p>
    </article>
  );
}
