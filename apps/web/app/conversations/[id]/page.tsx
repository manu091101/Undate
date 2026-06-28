'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, use } from 'react';
import { Sparkle, cn } from '@lumin/ui';

interface Message {
  id: string;
  byMe: boolean;
  body: string;
  kind: string;
  aiAssisted: boolean;
  createdAt: string;
}

interface Thread {
  id: string;
  matchId: string;
  isMutual: boolean;
  mutualAt: string | null;
  other: {
    userId: string;
    displayName: string;
    age: number | null;
    city: string;
    bioShort: string | null;
    photoUrl: string;
  };
  messages: Message[];
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ' · ' +
        d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [thread, setThread] = useState<Thread | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showFlash, setShowFlash] = useState<string | null>(null);

  // Initial fetch + 5s polling for new messages while the page is visible.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function fetchThread() {
      const res = await fetch(`/api/conversations/${id}`, { cache: 'no-store' });
      if (cancelled) return;
      if (res.ok) {
        const j = (await res.json()) as Thread;
        setThread(j);
      } else if (res.status === 404) {
        setError('Conversation not found.');
      } else if (res.status === 403) {
        setError('You don\'t have access to this conversation.');
      } else {
        setError('Could not load the conversation.');
      }
    }
    void fetchThread();
    timer = setInterval(fetchThread, 5000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [id]);

  useEffect(() => {
    // auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread?.messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (res.ok) {
      const j = (await res.json()) as { message: Message; mutual: boolean };
      setThread((cur) => (cur ? { ...cur, messages: [...cur.messages, j.message] } : cur));
      setDraft('');
      if (j.mutual) {
        setShowFlash('✦ You both wrote first. Quiet match.');
        setTimeout(() => setShowFlash(null), 4000);
      }
    } else {
      // Best-effort error
      setShowFlash('Could not send. Try again.');
      setTimeout(() => setShowFlash(null), 3000);
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/conversations" className="text-sm text-cream-50/60 hover:text-cream-50">
          ← Inbox
        </Link>
        <p className="mt-10 text-sm text-blush-500">{error}</p>
      </main>
    );
  }

  if (!thread) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/conversations" className="text-sm text-cream-50/60 hover:text-cream-50">
          ← Inbox
        </Link>
        <div className="mt-10 h-96 rounded-lg bg-ink-700/40 animate-pulse" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-[100dvh] max-w-2xl flex-col px-0 sm:px-6">
      <header className="flex items-center justify-between gap-3 border-b border-cream-50/10 px-6 py-4 sm:px-0">
        <Link href="/conversations" className="text-sm text-cream-50/60 hover:text-cream-50">
          ←
        </Link>
        <div className="flex items-center gap-3">
          <img
            src={thread.other.photoUrl}
            alt={thread.other.displayName}
            className="h-9 w-9 rounded-full object-cover ring-1 ring-cream-50/10"
            referrerPolicy="no-referrer"
          />
          <div className="text-center">
            <p className="font-display text-sm tracking-tight">
              {thread.other.displayName}
              {thread.other.age ? `, ${thread.other.age}` : ''}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-cream-50/40">
              {thread.isMutual ? (
                <span className="text-gold-300 inline-flex items-center gap-1">
                  <Sparkle size={9} /> Quiet match
                </span>
              ) : (
                thread.other.city
              )}
            </p>
          </div>
        </div>
        <Link
          href={`/conversations/${id}/about`}
          className="text-xs text-cream-50/60 hover:text-cream-50"
        >
          About
        </Link>
      </header>

      {!thread.isMutual ? (
        <div className="mx-6 mt-4 rounded-md border border-sparkle-500/20 bg-sparkle-500/[0.06] p-3 text-xs text-cream-50/65 sm:mx-0">
          Introduction sent. The conversation opens fully when {thread.other.displayName.split(' ')[0]}{' '}
          replies. Undate does not show read receipts.
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-3 sm:px-0"
      >
        {thread.messages.length === 0 ? (
          <p className="text-center text-sm italic text-cream-50/45 py-10">
            Write the first message.
          </p>
        ) : null}
        {thread.messages.map((m, i) => {
          const prev = thread.messages[i - 1];
          const samePrev = prev && prev.byMe === m.byMe;
          return (
            <div
              key={m.id}
              className={cn('flex flex-col', m.byMe ? 'items-end' : 'items-start')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
                  m.byMe
                    ? 'bg-gold-500/15 text-cream-50 rounded-br-md'
                    : 'bg-ink-700 text-cream-50 rounded-bl-md',
                  samePrev && (m.byMe ? 'rounded-tr-md' : 'rounded-tl-md'),
                )}
              >
                {m.body}
                {m.aiAssisted ? (
                  <span className="ml-1.5 text-[10px] text-sparkle-500/80 inline-flex items-center gap-0.5">
                    <Sparkle size={9} /> assisted
                  </span>
                ) : null}
              </div>
              <span className="mt-1 text-[10px] font-mono text-cream-50/30">
                {fmtTime(m.createdAt)}
              </span>
            </div>
          );
        })}
      </div>

      {showFlash ? (
        <div className="mx-6 mb-3 rounded-md border border-gold-500/40 bg-gold-500/5 px-4 py-2 text-center text-xs text-gold-300 sm:mx-0">
          {showFlash}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="sticky bottom-0 border-t border-cream-50/10 bg-ink-900 px-6 py-3 sm:px-0"
      >
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Write a message…"
            className="flex-1 resize-none rounded-2xl border border-cream-50/15 bg-ink-700 px-4 py-2.5 text-sm text-cream-50 outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/40"
            maxLength={4000}
          />
          <button
            type="submit"
            disabled={sending || draft.trim().length === 0}
            aria-label="Send message"
            className={cn(
              'h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-colors',
              draft.trim().length === 0
                ? 'bg-cream-50/5 text-cream-50/30'
                : 'bg-gold-500 text-ink-900 hover:bg-gold-300',
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8L14 2L8 14L7 9L2 8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="currentColor"
                fillOpacity="0.2"
              />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-cream-50/35 px-1">
          Press Enter to send · Shift + Enter for newline · Undate never sends for you.
        </p>
      </form>
    </main>
  );
}
