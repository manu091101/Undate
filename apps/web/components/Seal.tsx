/**
 * Antique rotating "wax seal" badge, circular text wrapped on a path with a
 * small mark in the centre. Pair with `animate-spin-slow` for the hero flourish.
 * Pure SVG, inherits `currentColor`.
 */
export function Seal({
  size = 104,
  text = 'UNDATE · INTENTIONAL MATCHMAKING · ',
  className = '',
}: {
  size?: number;
  text?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      aria-hidden
    >
      <defs>
        <path id="seal-circle" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
      </defs>
      <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <circle cx="100" cy="100" r="82" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      <text fill="currentColor" fontSize="14.5" fontWeight="700" letterSpacing="3.2" fontFamily="var(--font-pixel)">
        <textPath href="#seal-circle" startOffset="0%">
          {text}
        </textPath>
      </text>
      {/* centre mark: a small struck-through "u" nod to the logo */}
      <text x="100" y="112" textAnchor="middle" fill="currentColor" fontSize="46" fontFamily="var(--font-display)" fontStyle="italic">
        u
      </text>
      <line x1="78" y1="96" x2="122" y2="96" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
