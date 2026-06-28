// Shared Tailwind preset. Web + admin import this. Mobile (NativeWind) imports tokens directly.
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [],
  theme: {
    extend: {
      colors: {
        // Undate theme: white + pink. Token NAMES are kept for class compatibility,
        // but their meanings are inverted vs the old dark theme:
        //   ink  = light surfaces (page backgrounds)
        //   cream = dark foreground (text)
        //   gold = pink accent
        // Combined with `className="dark"` on <html>, the existing `dark:` button
        // variants resolve into correct light-theme styling.
        ink: {
          900: '#FFFFFF', // page background
          700: '#FDF2F8', // soft pink-tinted surface
          500: '#FBE3EE', // tertiary surface / hover
        },
        cream: {
          50: '#1B1016', // primary text (warm near-black)
          100: '#4A2E3B', // secondary text
        },
        gold: {
          300: '#F9A8D4', // light pink accent
          500: '#EC4899', // primary pink
          700: '#BE185D', // strong pink / magenta
        },
        sage: { 500: '#9DB4A0' },
        blush: { 500: '#F7C9DC' }, // soft secondary pink
        sparkle: { 500: '#C084FC' }, // soft purple highlight
        noir: '#0E0E12', // true dark — logo lockup container & dark sections
      },
      fontFamily: {
        // Ditto-style: a clean, modern grotesque for display + Inter for body.
        display: ['var(--font-display)', '"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-xl': ['3rem', { lineHeight: '3.25rem', letterSpacing: '-0.02em' }],
        display: ['2rem', { lineHeight: '2.375rem', letterSpacing: '-0.015em' }],
        title: ['1.5rem', { lineHeight: '1.875rem' }],
        headline: ['1.25rem', { lineHeight: '1.625rem' }],
      },
      borderRadius: {
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1.25rem',
        xl: '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(14,14,18,0.04), 0 8px 24px rgba(14,14,18,0.06)',
        lift: '0 12px 48px rgba(14,14,18,0.18)',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.32, 0.72, 0, 1)',
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
        decelerate: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      transitionDuration: {
        fast: '180ms',
        base: '240ms',
        emphasis: '320ms',
        slow: '480ms',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
