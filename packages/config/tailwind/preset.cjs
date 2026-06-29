// Shared Tailwind preset. Web + admin import this. Mobile (NativeWind) imports tokens directly.
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [],
  theme: {
    extend: {
      colors: {
        // Undate brand: TRUE BLACK + dusty mauve-ROSE (#D27A89, sampled from the logo).
        // Token NAMES are kept for class compatibility across the whole app:
        //   ink   = black / near-black warm surfaces (page backgrounds, cards)
        //   cream = warm-white foreground (text on dark)
        //   gold  = the rose accent ramp (primary brand colour)
        // <html className="dark"> keeps the existing `dark:` variants resolving correctly.
        ink: {
          900: '#000000', // page background — true black (matches the logo lockup)
          800: '#0A0708', // section background
          700: '#14100F', // raised surface / cards — warm near-black
          600: '#1F1817', // elevated surface / hover
          500: '#2B2120', // borders / tertiary surface
        },
        cream: {
          50: '#F6EEEC', // primary text (warm white)
          100: '#C5B2AF', // secondary text (warm grey)
        },
        // The rose accent ramp (was "gold"). Kept under the `gold` key so existing
        // `text-gold-500`, `bg-gold-500`, `border-gold-500/30` classes recolour for free.
        gold: {
          300: '#E8B5BD', // light rose
          400: '#DD97A2', // soft rose
          500: '#D27A89', // primary rose (exact logo "date" colour)
          600: '#B85F6E', // deeper rose
          700: '#94434F', // deep mauve
        },
        sage: { 500: '#8A7370' }, // warm taupe (repurposed)
        blush: { 500: '#E0A7AF' }, // soft secondary rose
        sparkle: { 500: '#D8A0AB' }, // highlight rose
        acid: { 500: '#F3D9DC' }, // pale rose for soft pops
        noir: '#000000', // true black — logo lockup container & deep sections
      },
      fontFamily: {
        // Retro-pixel display + characterful serif + clean sans body.
        pixel: ['var(--font-pixel)', '"Jersey 25"', 'ui-monospace', 'monospace'],
        display: ['var(--font-display)', '"Casablanca Antique"', 'Georgia', 'serif'],
        serif: ['var(--font-display)', '"Casablanca Antique"', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', '"Rubik"', 'system-ui', 'sans-serif'],
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
        '2xl': '2rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.35)',
        lift: '0 18px 60px rgba(0,0,0,0.55)',
        glow: '0 0 0 1px rgba(210,122,137,0.4), 0 0 40px rgba(210,122,137,0.3)',
        // Hard retro/sticker drop-shadow (no blur) — chunky offset look.
        retro: '6px 6px 0 0 rgba(0,0,0,0.9)',
        'retro-rose': '6px 6px 0 0 #94434F',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.32, 0.72, 0, 1)',
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
        decelerate: 'cubic-bezier(0.4, 0, 0.6, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        fast: '180ms',
        base: '240ms',
        emphasis: '320ms',
        slow: '480ms',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) rotate(var(--tw-rotate, 0deg))' },
          '50%': { transform: 'translateY(-18px) rotate(var(--tw-rotate, 0deg))' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        blob: {
          '0%, 100%': { borderRadius: '42% 58% 63% 37% / 41% 44% 56% 59%' },
          '50%': { borderRadius: '58% 42% 37% 63% / 56% 59% 41% 44%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(210,122,137,0.5)' },
          '50%': { boxShadow: '0 0 0 14px rgba(210,122,137,0)' },
        },
        'roll-in': {
          '0%': { transform: 'translateY(108%) rotate(2deg)', opacity: '0', filter: 'blur(4px)' },
          '60%': { filter: 'blur(0)' },
          '100%': { transform: 'translateY(0) rotate(0)', opacity: '1', filter: 'blur(0)' },
        },
        'roll-out': {
          '0%': { transform: 'translateY(0) rotate(0)', opacity: '1' },
          '100%': { transform: 'translateY(-108%) rotate(-2deg)', opacity: '0', filter: 'blur(4px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.2, 0, 0, 1) both',
        'fade-in': 'fade-in 0.8s ease both',
        float: 'float 5s ease-in-out infinite',
        'float-slow': 'float-slow 7s ease-in-out infinite',
        wiggle: 'wiggle 0.4s ease-in-out',
        marquee: 'marquee 28s linear infinite',
        'spin-slow': 'spin-slow 22s linear infinite',
        blob: 'blob 12s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'roll-in': 'roll-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both',
        'roll-out': 'roll-out 0.45s cubic-bezier(0.4,0,1,1) both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
