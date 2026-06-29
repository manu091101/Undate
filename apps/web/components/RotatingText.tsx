'use client';

import { useEffect, useState } from 'react';

/**
 * Ditto-style "run over" word cycler. The current word rolls up and out while
 * the next rolls up into place, on a loop. Reduced-motion users just see the
 * words swap with no travel.
 */
export function RotatingText({
  words,
  className = '',
  interval = 2200,
}: {
  words: string[];
  className?: string;
  interval?: number;
}) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setPrev(i);
      setI((n) => (n + 1) % words.length);
    }, interval);
    return () => clearInterval(id);
  }, [i, interval, words.length]);

  return (
    <span className={`relative inline-grid overflow-hidden align-bottom ${className}`} aria-label={words[i]}>
      {/* sizing ghost keeps width/height to the longest word */}
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
        {words.reduce((a, b) => (b.length > a.length ? b : a), '')}
      </span>
      <span
        key={`in-${i}`}
        className="col-start-1 row-start-1 animate-roll-in whitespace-nowrap"
      >
        {words[i]}
      </span>
      {prev !== null && prev !== i && (
        <span
          key={`out-${prev}`}
          className="col-start-1 row-start-1 animate-roll-out whitespace-nowrap"
          onAnimationEnd={() => setPrev(null)}
        >
          {words[prev]}
        </span>
      )}
    </span>
  );
}
