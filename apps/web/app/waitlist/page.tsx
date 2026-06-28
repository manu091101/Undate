'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@lumin/ui';

type FormState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

const inputCls =
  'rounded-md border border-cream-50/15 bg-ink-700 px-4 py-3 text-cream-50 outline-none focus:border-gold-500/60';

export default function WaitlistPage() {
  const [state, setState] = useState<FormState>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get('email') ?? '').trim(),
      city: String(form.get('city') ?? '').trim() || undefined,
      region: String(form.get('region') ?? 'SG'),
      answers: {
        ageRange: String(form.get('ageRange') ?? '25-29'),
        intention: String(form.get('intention') ?? 'SERIOUS_DATING'),
        lookingFor: String(form.get('lookingFor') ?? '').trim(),
        whyJoin: String(form.get('whyJoin') ?? '').trim(),
      },
    };
    setState({ kind: 'submitting' });
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: unknown };
        setState({
          kind: 'error',
          message:
            json && typeof json.error === 'object'
              ? 'Please check the form — some fields look off.'
              : 'Something went wrong. Try again in a moment.',
        });
        return;
      }
      setState({ kind: 'success' });
    } catch {
      setState({ kind: 'error', message: 'Network error. Try again.' });
    }
  }

  if (state.kind === 'success') {
    return (
      <main className="mx-auto max-w-xl px-6 py-24">
        <Link href="/" className="text-sm text-cream-50/60 hover:text-cream-50">
          ← Undate
        </Link>
        <h1 className="mt-12 font-display text-4xl tracking-tight">Thank you.</h1>
        <p className="mt-4 text-cream-50/70">
          Your request has been received. We accept members slowly and intentionally — a curator will
          review your note personally, and we&apos;ll be in touch when there&apos;s a place for you.
        </p>
        <p className="mt-6 text-sm text-cream-50/50">
          Once approved, you&apos;ll receive a private invitation link to create your account.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <Link href="/" className="text-sm text-cream-50/60 hover:text-cream-50">
        ← Undate
      </Link>
      <h1 className="mt-10 font-display text-4xl tracking-tight">Request your invitation.</h1>
      <p className="mt-4 text-cream-50/70">
        Membership is by invitation. A few short questions help our curators understand who you are
        and what you&apos;re looking for.
      </p>

      <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5" noValidate>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-cream-50/70">Email</span>
          <input type="email" name="email" required autoComplete="email" className={inputCls} placeholder="you@example.com" />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-cream-50/70">City</span>
          <input type="text" name="city" autoComplete="address-level2" className={inputCls} placeholder="Where are you based?" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-cream-50/70">Your age</span>
            <select name="ageRange" defaultValue="25-29" className={inputCls}>
              <option value="21-24">21–24</option>
              <option value="25-29">25–29</option>
              <option value="30-34">30–34</option>
              <option value="35-39">35–39</option>
              <option value="40-44">40–44</option>
              <option value="45+">45+</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-cream-50/70">What you&apos;re after</span>
            <select name="intention" defaultValue="LIFE_PARTNER" className={inputCls}>
              <option value="SERIOUS_DATING">Serious dating</option>
              <option value="LIFE_PARTNER">A life partner</option>
              <option value="MARRIAGE">Marriage</option>
              <option value="EXPLORING">Exploring, with intention</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-cream-50/70">Who are you hoping to meet?</span>
          <textarea
            name="lookingFor"
            required
            maxLength={280}
            rows={2}
            className={inputCls}
            placeholder="The kind of person, or connection, you're looking for."
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-cream-50/70">Why do you want in?</span>
          <textarea
            name="whyJoin"
            required
            maxLength={500}
            rows={3}
            className={inputCls}
            placeholder="A sentence or two, in your own words. This is the part our curators actually read."
          />
        </label>

        {/* Region drives data routing only; kept minimal and unmarketed. */}
        <input type="hidden" name="region" value="SG" />

        {state.kind === 'error' ? (
          <p className="text-sm text-blush-500" role="alert">
            {state.message}
          </p>
        ) : null}
        <Button type="submit" size="lg" variant="gold" className="mt-2" disabled={state.kind === 'submitting'}>
          {state.kind === 'submitting' ? 'Sending…' : 'Send my request'}
        </Button>
      </form>
    </main>
  );
}
