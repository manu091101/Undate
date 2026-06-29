'use client';

import { useEffect, useRef, useState } from 'react';

const GLYPHS = '█▓▒░@#%&*<>/\\undate0123'.split('');

/**
 * Decode/glitch text effect. On mount (and on hover) the word cycles through
 * random glyphs and resolves character-by-character into the final text, the
 * "crazy" eye-catch on the hero word. Honours prefers-reduced-motion.
 */
export function Scramble({
  text,
  className = '',
  speed = 38,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const [display, setDisplay] = useState(text);
  const frame = useRef(0);
  const raf = useRef<number | null>(null);

  function run() {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(text);
      return;
    }
    const start = performance.now();
    const total = text.length * speed + 420;
    const tick = (now: number) => {
      const elapsed = now - start;
      const revealed = Math.floor((elapsed / total) * text.length * 1.25);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') out += ' ';
        else if (i < revealed) out += text[i];
        else out += GLYPHS[(frame.current + i) % GLYPHS.length];
      }
      setDisplay(out);
      frame.current++;
      if (revealed < text.length) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    };
    raf.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    run();
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <span
      className={`inline-block cursor-default tabular-nums ${className}`}
      onMouseEnter={run}
      aria-label={text}
    >
      {display}
    </span>
  );
}
