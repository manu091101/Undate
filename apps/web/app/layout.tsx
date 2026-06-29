import type { Metadata } from 'next';
import { Rubik, Jersey_25 } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

// Brand display serif, Casablanca Antique (licensed file in ./fonts).
const display = localFont({
  src: [
    { path: './fonts/CasablancaAntique-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/CasablancaAntique-Italic.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
});

// Clean, friendly body sans (Ditto uses Rubik too).
const sans = Rubik({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Retro-pixel display face for the big brand moments.
const pixel = Jersey_25({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pixel',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Undate, Intentional matchmaking',
    template: '%s · Undate',
  },
  description:
    'A quiet, considered place to meet someone. Undate pairs thoughtful psychological profiling with hand-curated introductions.',
  openGraph: {
    title: 'Undate',
    description: 'Intentional matchmaking for the people who know what they want.',
    type: 'website',
  },
  icons: { icon: '/undate-logo.png' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${display.variable} ${sans.variable} ${pixel.variable}`}
    >
      <body className="min-h-screen bg-ink-900 text-cream-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
