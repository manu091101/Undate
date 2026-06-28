'use client';

import { useState } from 'react';

/**
 * Undate logo. Overlays the owner-supplied artwork at /public/undate-logo.png
 * (the exact pasted image — never recreated). Because the supplied art has a
 * black background, it sits inside a `noir` rounded lockup so it reads as a
 * deliberate logo tile on the white/pink theme. If the file is missing, it
 * degrades to a plain "Undate" wordmark instead of a broken-image icon.
 */
export function Logo({
  height = 34,
  className = '',
  framed = true,
}: {
  height?: number;
  className?: string;
  framed?: boolean;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <span
        className={`font-display font-semibold tracking-tight text-cream-50 ${className}`}
        style={{ fontSize: Math.round(height * 0.72) }}
      >
        Undate
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden ${
        framed ? 'rounded-2xl bg-noir shadow-soft' : ''
      } ${className}`}
      style={framed ? { padding: Math.round(height * 0.18) } : undefined}
    >
      <img
        src="/undate-logo.png"
        alt="Undate"
        onError={() => setErrored(true)}
        className="object-contain"
        style={{ height, width: 'auto', display: 'block' }}
      />
    </span>
  );
}
