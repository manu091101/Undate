'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button } from '@lumin/ui';

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string };

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const inviteToken = params.get('token') ?? undefined;
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get('email') ?? '').trim().toLowerCase(),
      password: String(form.get('password') ?? ''),
      displayName: String(form.get('displayName') ?? '').trim(),
      dateOfBirth: String(form.get('dateOfBirth') ?? ''),
      gender: String(form.get('gender') ?? 'WOMAN'),
      city: String(form.get('city') ?? '').trim(),
      region: 'SG',
      ...(inviteToken ? { inviteToken } : {}),
    };
    setState({ kind: 'submitting' });
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 201) {
      router.push('/onboarding');
      router.refresh();
      return;
    }
    if (res.status === 409) {
      setState({ kind: 'error', message: 'That email already has an Undate account. Try signing in.' });
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    const message =
      data.error === 'invite_invalid'
        ? 'This invitation link is no longer valid.'
        : data.error === 'invite_expired'
          ? 'This invitation has expired. Please request a new one.'
          : data.error === 'validation'
            ? 'Please check the form.'
            : 'Something went wrong. Try again.';
    setState({ kind: 'error', message });
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Link href="/" className="text-sm text-cream-50/60 hover:text-cream-50">
        ← Undate
      </Link>
      <h1 className="mt-10 font-display text-3xl tracking-tight">Create your Undate account.</h1>
      <p className="mt-3 text-sm text-cream-50/70">
        Next, you&apos;ll have a short conversation with our matchmaker. A curator reviews every
        profile by hand.
      </p>

      {inviteToken ? (
        <div className="mt-6 rounded-xl border border-gold-500/30 bg-gold-500/10 p-4 text-sm text-cream-50/80">
          Your invitation has been accepted. Welcome, let&apos;s set up your account.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <Field label="Your name">
          <input name="displayName" required minLength={2} maxLength={40} autoComplete="name" className={inputCls} placeholder="Aanya" />
        </Field>
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={inputCls} placeholder="you@example.com" />
        </Field>
        <Field label="Password (8+ characters)">
          <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={inputCls} placeholder="••••••••" />
        </Field>
        <Field label="Date of birth (21+)">
          <input name="dateOfBirth" type="date" required className={inputCls} />
        </Field>
        <Field label="Gender">
          <select name="gender" defaultValue="WOMAN" className={inputCls}>
            <option value="WOMAN">Woman</option>
            <option value="MAN">Man</option>
            <option value="NONBINARY">Non-binary</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>
        </Field>
        <Field label="City">
          <input name="city" required minLength={1} maxLength={80} autoComplete="address-level2" className={inputCls} placeholder="Where you're based" />
        </Field>
        {state.kind === 'error' ? (
          <p className="text-sm text-blush-500" role="alert">{state.message}</p>
        ) : null}
        <Button type="submit" size="lg" variant="gold" className="mt-4" disabled={state.kind === 'submitting'}>
          {state.kind === 'submitting' ? 'Creating account…' : 'Continue'}
        </Button>
        <p className="mt-4 text-center text-sm text-cream-50/60">
          Already a member?{' '}
          <Link href="/login" className="text-gold-700 hover:text-gold-500">Sign in.</Link>
        </p>
      </form>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

const inputCls =
  'rounded-md border border-cream-50/15 bg-ink-700 px-4 py-3 text-cream-50 outline-none focus:border-gold-500/60';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="text-cream-50/70">{label}</span>
      {children}
    </label>
  );
}
