'use client';

import Link from 'next/link';
import { Button } from '@lumin/ui';

interface Props {
  target: { displayName: string; primaryPhoto: string };
  conversationId: string;
  onClose: () => void;
}

// "It's a quiet match." — restraint over confetti. Lavender + gold radial,
// single haptic-equivalent fade, no sound. Per the chat-flow architect agent.
export default function MutualMatchModal({ target, conversationId, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/85 backdrop-blur-md p-4">
      <div
        className="relative w-full max-w-md rounded-xl bg-ink-700 ring-1 ring-gold-500/30 p-10 text-center shadow-lift overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at top, rgba(184,164,217,0.18) 0%, rgba(199,169,113,0.06) 35%, rgba(28,28,34,1) 75%)',
        }}
      >
        <div className="text-2xl text-sparkle-500">✦</div>
        <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-gold-300">A quiet match</p>
        <h2 className="mt-3 font-display text-4xl tracking-tight">
          You and {target.displayName.split(' ')[0]}.
        </h2>
        <div className="mx-auto mt-7 h-24 w-24 overflow-hidden rounded-full ring-2 ring-gold-500/40">
          <img
            src={target.primaryPhoto}
            alt={target.displayName}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <p className="mt-7 text-sm leading-relaxed text-cream-50/75">
          They replied. The conversation is yours — take your time.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href={`/conversations/${conversationId}`}>
            <Button variant="gold" size="lg" className="w-full">
              Go to the conversation →
            </Button>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-cream-50/55 hover:text-cream-50"
          >
            I'll come back to it
          </button>
        </div>
      </div>
    </div>
  );
}
