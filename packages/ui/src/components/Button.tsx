import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const buttonVariants = cva(
  'group relative inline-flex items-center justify-center gap-2 font-sans font-semibold tracking-tight ' +
    'transition-all duration-base ease-spring will-change-transform ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 ' +
    'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ' +
    'disabled:opacity-40 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        // Hero CTA: chunky purple sticker with a hard offset shadow that snaps on hover.
        gold:
          'bg-gold-500 text-white border-2 border-black shadow-retro ' +
          'hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-gold-400 hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.85)]',
        primary:
          'bg-cream-50 text-ink-900 border-2 border-black shadow-retro ' +
          'hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.85)]',
        secondary:
          'bg-ink-700 text-cream-50 border-2 border-gold-500/40 ' +
          'hover:bg-ink-600 hover:border-gold-500/70',
        ghost:
          'bg-transparent text-cream-50 border-2 border-transparent hover:border-gold-500/40 hover:bg-gold-500/10',
        sparkle:
          'bg-sparkle-500/10 text-sparkle-500 hover:bg-sparkle-500/20 border-2 border-sparkle-500/30',
        outline:
          'bg-transparent text-cream-50 border-2 border-cream-50/30 hover:border-gold-400 hover:text-gold-300',
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-full',
        md: 'h-11 px-6 text-base rounded-full',
        lg: 'h-12 px-7 text-base rounded-full',
        xl: 'h-14 px-9 text-lg rounded-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';
