'use client';

import { useState } from 'react';

/**
 * Resilient photograph. Renders a remote stock image (Unsplash/Pexels, already
 * whitelisted in next.config CSP). On any load error it degrades to a soft pink
 * gradient instead of a broken-image icon, so the layout always looks intentional.
 */
export function Photo({
  src,
  alt,
  className = '',
  rounded = 'rounded-2xl',
}: {
  src: string;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-gold-300/40 via-blush-500/50 to-gold-500/30 ${rounded} ${className}`}
      >
        <span className="font-display text-sm text-cream-50/50">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className={`object-cover ${rounded} ${className}`}
    />
  );
}
