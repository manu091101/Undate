'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, Sparkle, cn } from '@lumin/ui';
import AppNav from '../../components/AppNav';

interface Conversation {
  id: string;
  matchId: string;
  isMutual: boolean;
  mutualAt: string | null;
  lastMessageAt: string | null;
  hasUnread: boolean;
  other: {
    userId: string;
    displayName: string;
    age: number | null;
    city: string;
    photoUrl: string;
  };
  preview: {
    body: string;
    byMe: boolean;
    kind: string;
    createdAt: string;
  } | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

export default function ConversationsPage() {
  const [items, setItems] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/conversations', { cache: 'no-store' });
      if (res.ok) {
        const j = (await res.json()) as { conversations: Conversation[] };
        setItems(j.conversations);
      } else {
        setError('Could not load your conversations.');
      }
    })();
  }, []);

  return (
    <>
    <AppNav />
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.18em] text-gold-300">Your inbox</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight">Conversations.</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream-50/65">
          Quiet matches and the openers you&apos;ve sent. We never show read receipts or
          last-active times, by design.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-blush-500">{error}</p>
      ) : null}

      {items === null && !error ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-ink-700/40 animate-pulse" />
          ))}
        </div>
      ) : null}

      {items?.length === 0 ? (
        <div className="rounded-lg border border-cream-50/10 p-8 text-sm text-cream-50/70">
          <p className="mb-2">No conversations yet.</p>
          <p className="text-xs text-cream-50/50">
            When you send an opener (or someone sends one to you), it&apos;ll arrive here.
          </p>
          <Link href="/matches" className="mt-4 inline-block text-gold-300 hover:text-gold-500">
            See this week&apos;s matches →
          </Link>
        </div>
      ) : null}

      <ul className="space-y-3">
        {items?.map((c) => (
          <li key={c.id}>
            <Link
              href={`/conversations/${c.id}`}
              className="group block"
              aria-label={`Open conversation with ${c.other.displayName}`}
            >
              <Card className="overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-cream-50/10">
                    <img
                      src={c.other.photoUrl}
                      alt={c.other.displayName}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-lg tracking-tight truncate">
                        {c.other.displayName}
                        {c.other.age ? `, ${c.other.age}` : ''}
                      </p>
                      {c.isMutual ? (
                        <span className="rounded-full border border-gold-500/40 bg-gold-500/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-gold-300 inline-flex items-center gap-1">
                          <Sparkle size={9} /> Quiet match
                        </span>
                      ) : c.preview && !c.preview.byMe ? (
                        <span className="rounded-full border border-sparkle-500/40 bg-sparkle-500/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-sparkle-500">
                          Introduction
                        </span>
                      ) : (
                        <span className="rounded-full border border-cream-50/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-cream-50/55">
                          Opener sent
                        </span>
                      )}
                      {c.hasUnread ? (
                        <span className="ml-auto h-2 w-2 rounded-full bg-gold-500" aria-label="unread" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-cream-50/55">{c.other.city}</p>
                    {c.preview ? (
                      <p
                        className={cn(
                          'mt-2 text-sm truncate',
                          c.hasUnread ? 'text-cream-50/90' : 'text-cream-50/55',
                        )}
                      >
                        {c.preview.byMe ? 'You: ' : ''}
                        {c.preview.body}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm italic text-cream-50/40">
                        No messages yet, write the first one.
                      </p>
                    )}
                  </div>
                  <span className="self-start text-[11px] font-mono text-cream-50/40">
                    {timeAgo(c.lastMessageAt)}
                  </span>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
    </>
  );
}
