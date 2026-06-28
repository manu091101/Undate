/**
 * Undate wordmark, rendered in code so it always displays crisply on the
 * white/pink theme (no image file, no broken-image risk). Faithful to the brand:
 * a refined serif "undate" with "un" struck through in pink, leaving "date".
 */
export function Logo({
  height = 28,
  className = '',
  tone = 'default',
}: {
  height?: number;
  className?: string;
  /** 'default' for the light theme; 'invert' for placing on a dark surface. */
  tone?: 'default' | 'invert';
}) {
  const un = tone === 'invert' ? 'text-white/85' : 'text-cream-50/75';
  return (
    <span
      className={`inline-flex items-baseline font-serif lowercase leading-none tracking-tight ${className}`}
      style={{ fontSize: height }}
      aria-label="Undate"
    >
      <span className={`relative ${un}`}>
        un
        <span
          aria-hidden
          className="absolute left-[-3%] right-[-3%] top-1/2 -translate-y-1/2 rounded-full bg-gold-500"
          style={{ height: Math.max(1.5, height * 0.05) }}
        />
      </span>
      <span className="text-gold-500">date</span>
    </span>
  );
}
