'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Sparkle, cn } from '@lumin/ui';

interface Props {
  target: {
    displayName: string;
    age: number;
    city: string;
    bioShort: string | null;
    primaryPhoto: string;
  };
  onCancel: () => void;
  onSend: (text: string) => Promise<void>;
}

const SCAFFOLDS = [
  'Ask about a specific thing on their profile',
  'Share something true about yourself',
  'Suggest something concrete to do',
];

// Three "starter scaffolds", copy that the user EDITS, not auto-sends.
// Undate's hard rule: AI may suggest, the human always presses send.
const SUGGESTIONS = (target: Props['target']) => [
  `${target.displayName}, saw that you live in ${target.city}. I'm always looking for a good place there; what's the one you'd take a friend to first?`,
  `${target.displayName}, your bio made me smile. What's been the most surprising thing about this year for you?`,
  `Bold pitch, ${target.displayName}, coffee at Tiong Bahru Bakery this Sunday morning if you're around?`,
];

export default function OpenerComposer({ target, onCancel, onSend }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setTimeout(() => ref.current?.focus(), 50);
    // ESC closes
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  function useSuggestion(s: string) {
    setText(s);
    ref.current?.focus();
  }

  async function send() {
    setError(null);
    const trimmed = text.trim();
    if (trimmed.length < 20) {
      setError('A real opener is at least a sentence. Undate asks for considered first messages.');
      return;
    }
    setSending(true);
    try {
      await onSend(trimmed);
    } catch (e) {
      setSending(false);
      setError(e instanceof Error ? e.message : 'Could not send. Try again.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-ink-700 ring-1 ring-cream-50/10 shadow-lift overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-3">
            <img
              src={target.primaryPhoto}
              alt={target.displayName}
              className="h-10 w-10 rounded-full object-cover ring-1 ring-cream-50/10"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="font-display text-lg tracking-tight">
                Write {target.displayName} an opener.
              </h3>
              <p className="text-xs text-cream-50/55">
                {target.displayName}, {target.age} · {target.city}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="rounded-full p-1 text-cream-50/60 hover:text-cream-50 hover:bg-cream-50/5"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 pt-5">
          <p className="text-xs text-cream-50/60 leading-relaxed">
            Undate never sends for you. Write something real, they'll see your face and your words,
            nothing else. Aim for two sentences.
          </p>
        </div>

        <div className="px-6 mt-4">
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Hi ${target.displayName}, …`}
            rows={5}
            maxLength={2000}
            className="w-full rounded-md border border-cream-50/15 bg-ink-900/50 px-4 py-3 text-cream-50 outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/40 text-sm leading-relaxed"
          />
          <div className="mt-1 flex items-center justify-between text-[11px] text-cream-50/40">
            <span>Minimum a sentence.</span>
            <span className="font-mono">{text.length}/2000</span>
          </div>
        </div>

        <div className="px-6 mt-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-sparkle-500">
            <Sparkle size={11} /> Need a scaffold? (Tap to fill, you edit before sending.)
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {SUGGESTIONS(target).map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => useSuggestion(s)}
                className="text-left rounded-md border border-sparkle-500/15 bg-sparkle-500/[0.04] px-3 py-2 text-xs leading-relaxed text-cream-50/75 hover:bg-sparkle-500/[0.08] hover:border-sparkle-500/30 transition-colors"
              >
                <span className="block text-[10px] uppercase tracking-[0.14em] text-sparkle-500/80 mb-1">
                  {SCAFFOLDS[i]}
                </span>
                {s}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="px-6 mt-3 text-xs text-blush-500" role="alert">{error}</p>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-cream-50/10 bg-ink-900/40 px-6 py-4">
          <span className="text-[11px] text-cream-50/40">
            By sending, you confirm this message is your own.
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={sending}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={send}
              disabled={sending || text.trim().length < 20}
              className={cn(sending && 'opacity-60')}
            >
              {sending ? 'Sending…' : 'Send opener'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
