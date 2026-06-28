import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-sans font-medium tracking-tight ' +
    'transition-all duration-base ease-standard ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 ' +
    'disabled:opacity-40 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-ink-900 text-cream-50 hover:bg-ink-700 dark:bg-cream-50 dark:text-ink-900 dark:hover:bg-cream-100',
        secondary:
          'bg-cream-100 text-ink-900 hover:bg-cream-50 dark:bg-ink-700 dark:text-cream-50 dark:hover:bg-ink-500',
        gold:
          'bg-gold-500 text-white hover:bg-gold-700',
        ghost:
          'bg-transparent text-ink-900 hover:bg-cream-100 dark:text-cream-50 dark:hover:bg-ink-700',
        sparkle:
          'bg-sparkle-500/10 text-sparkle-500 hover:bg-sparkle-500/20 border border-sparkle-500/20',
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded-md',
        md: 'h-11 px-5 text-base rounded-md',
        lg: 'h-12 px-6 text-base rounded-lg',
        xl: 'h-14 px-8 text-lg rounded-lg',
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
