// Lumin design tokens. Single source of truth for web + admin + mobile.
// Update here; Tailwind preset (packages/config/tailwind) consumes these.

export const palette = {
  ink: {
    900: '#0E0E12',
    700: '#1C1C22',
    500: '#3A3A44',
  },
  cream: {
    50: '#F5F1EA',
    100: '#EDE7DC',
  },
  gold: {
    300: '#E3CFA6', // gold-on-dark text
    500: '#C7A971',
    700: '#8C7445', // gold-on-cream text (WCAG AA)
  },
  sage: {
    500: '#9DB4A0', // success / "matched"
  },
  blush: {
    500: '#E8C5C0', // emotional moments only
  },
  sparkle: {
    500: '#B8A4D9', // AI affordance — single allowed color for ✦
  },
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

export const spacing = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96] as const;

export const motion = {
  fast: 180,
  base: 240,
  emphasis: 320,
  slow: 480,
  easing: {
    standard: 'cubic-bezier(0.32, 0.72, 0, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    decelerate: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
} as const;

export const typography = {
  display: '"Tiempos Headline", Georgia, serif',
  serifText: '"Tiempos Text", Georgia, serif',
  sans: '"Söhne", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"Söhne Mono", ui-monospace, "SF Mono", Menlo, monospace',
} as const;

export const shadow = {
  soft:
    '0 1px 2px rgba(14,14,18,0.04), 0 8px 24px rgba(14,14,18,0.06)',
  lift: '0 12px 48px rgba(14,14,18,0.18)',
} as const;
