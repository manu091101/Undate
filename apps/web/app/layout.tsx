import type { Metadata } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
    <html lang="en" className={`dark ${display.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-ink-900 text-cream-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
