import type { ReactNode } from 'react';
import { Photo } from './Photo';

/**
 * A taped-up polaroid. The building block of Undate's photo-collage layovers:
 * a chunky bordered frame with a hard retro shadow, a strip of "tape", an
 * optional caption, and a tilt. Compose several at different rotations/offsets
 * inside a `relative` container to get the overlapping collage look.
 */
export function Polaroid({
  src,
  alt,
  caption,
  rotate = '-3deg',
  tape = true,
  className = '',
  imgClassName = 'h-56 w-full',
}: {
  src: string;
  alt: string;
  caption?: string;
  rotate?: string;
  tape?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <figure
      className={`group relative inline-block rounded-[6px] border-2 border-black bg-cream-50 p-2.5 pb-3 shadow-retro transition-transform duration-base ease-spring hover:rotate-0 hover:scale-[1.03] ${className}`}
      style={{ transform: `rotate(${rotate})` }}
    >
      {tape && (
        <span
          aria-hidden
          className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-4deg] rounded-[2px] bg-gold-400/70 shadow-sm backdrop-blur-sm"
        />
      )}
      <Photo src={src} alt={alt} rounded="rounded-[3px]" className={imgClassName} />
      {caption && (
        <figcaption className="mt-2 text-center font-display text-sm italic text-ink-900/80">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * A small rotated "sticker" badge, pill of colour with a hard border + offset
 * shadow. Drop it over photos and section corners for retro flair.
 */
export function Sticker({
  children,
  rotate = '-6deg',
  tone = 'purple',
  className = '',
  float = false,
}: {
  children: ReactNode;
  rotate?: string;
  tone?: 'purple' | 'cream' | 'black' | 'lilac';
  className?: string;
  float?: boolean;
}) {
  const tones: Record<string, string> = {
    purple: 'bg-gold-500 text-white',
    lilac: 'bg-gold-300 text-ink-900',
    cream: 'bg-cream-50 text-ink-900',
    black: 'bg-black text-cream-50',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,0.85)] ${tones[tone]} ${float ? 'animate-float-slow' : ''} ${className}`}
      style={{ transform: `rotate(${rotate})` }}
    >
      {children}
    </span>
  );
}
