'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button } from '@lumin/ui';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [state, setState] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState('submitting');
    setMessage(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: String(form.get('email') ?? '').trim().toLowerCase(),
        password: String(form.get('password') ?? ''),
      }),
    });
    if (res.ok) {
      router.push(next);
      router.refresh();
      return;
    }
    setState('error');
    if (res.status === 401) setMessage('Email or password is wrong.');
    else if (res.status === 403) setMessage('That account is no longer active.');
    else setMessage('Something went wrong. Try again.');
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <Link href="/" className="text-sm text-cream-50/60 hover:text-cream-50">
        ← Undate
      </Link>
      <h1 className="mt-10 font-display text-3xl tracking-tight">Welcome back.</h1>
      <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-cream-50/70">Email</span>
          <input name="email" type="email" required autoComplete="email" className={inputCls} />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-cream-50/70">Password</span>
          <input name="password" type="password" required autoComplete="current-password" className={inputCls} />
        </label>
        {message ? <p className="text-sm text-blush-500" role="alert">{message}</p> : null}
        <Button type="submit" size="lg" variant="gold" className="mt-4" disabled={state === 'submitting'}>
          {state === 'submitting' ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="mt-4 text-center text-sm text-cream-50/60">
          No account yet?{' '}
          <Link href="/signup" className="text-gold-700 hover:text-gold-500">Create one.</Link>
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

const inputCls =
  'rounded-md border border-cream-50/15 bg-ink-700 px-4 py-3 text-cream-50 outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/0';
