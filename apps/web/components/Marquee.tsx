import type { ReactNode } from 'react';

/**
 * Infinite horizontal marquee. Renders its children twice and slides the track
 * by -50% on a loop, so the seam is invisible. Pure CSS (animate-marquee).
 */
export function Marquee({
  children,
  reverse = false,
  className = '',
}: {
  children: ReactNode;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={`marquee-mask group flex overflow-hidden ${className}`}>
      <div
        className="flex shrink-0 animate-marquee items-center gap-4 group-hover:[animation-play-state:paused]"
        style={reverse ? { animationDirection: 'reverse' } : undefined}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
