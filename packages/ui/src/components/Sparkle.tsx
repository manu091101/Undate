import * as React from 'react';
import { cn } from '../lib/cn';

// The single canonical AI affordance icon for Lumin. Only allowed color: sparkle-500 (#B8A4D9).
// Per EU AI Act Art 50 transparency requirements, this marks anything AI-touched.
export function Sparkle({ className, size = 16, ...rest }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn('text-sparkle-500 inline-block', className)}
      {...rest}
    >
      <path
        fill="currentColor"
        d="M12 2l1.7 5.3a4 4 0 0 0 2.5 2.5L21.5 11.5l-5.3 1.7a4 4 0 0 0-2.5 2.5L12 21l-1.7-5.3a4 4 0 0 0-2.5-2.5L2.5 11.5l5.3-1.7a4 4 0 0 0 2.5-2.5L12 2z"
      />
    </svg>
  );
}
