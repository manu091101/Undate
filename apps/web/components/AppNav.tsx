'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn, Sparkle } from '@lumin/ui';
import { Logo } from './Logo';

const NAV = [
  { href: '/matches', label: 'Matches' },
  { href: '/conversations', label: 'Inbox' },
  { href: '/profile', label: 'Profile' },
] as const;

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch('/api/conversations', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const j = (await res.json()) as { conversations: { hasUnread: boolean }[] };
        setUnread(j.conversations.filter((c) => c.hasUnread).length);
      } catch {
        /* swallow */
      }
    }
    void poll();
    const t = setInterval(poll, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [pathname]);

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-cream-50/8 bg-ink-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
        <Link href="/dashboard" aria-label="Undate home">
          <Logo height={28} />
        </Link>
        <nav className="hidden sm:flex items-center gap-1">
          {NAV.map((n) => {
            const active = isActive(n.href);
            const showDot = n.href === '/conversations' && unread > 0;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'relative rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'text-cream-50 bg-cream-50/[0.06]'
                    : 'text-cream-50/65 hover:text-cream-50 hover:bg-cream-50/[0.04]',
                )}
              >
                {n.label}
                {showDot ? (
                  <span
                    aria-label={`${unread} unread`}
                    className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-gold-500"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {/* Mobile menu trigger */}
          <button
            type="button"
            className="sm:hidden rounded-md p-2 text-cream-50/70 hover:bg-cream-50/5"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((m) => !m)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={signOut}
            className="hidden sm:inline-flex text-xs text-cream-50/55 hover:text-cream-50"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="sm:hidden border-t border-cream-50/8 px-6 py-3 space-y-1 bg-ink-900">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2.5 text-sm',
                  active ? 'bg-cream-50/[0.06] text-cream-50' : 'text-cream-50/75 hover:bg-cream-50/[0.04]',
                )}
              >
                <span>{n.label}</span>
                {n.href === '/conversations' && unread > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] text-gold-300">
                    <Sparkle size={10} /> {unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={signOut}
            className="block w-full text-left rounded-md px-3 py-2.5 text-sm text-cream-50/55 hover:bg-cream-50/[0.04]"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </header>
  );
}
