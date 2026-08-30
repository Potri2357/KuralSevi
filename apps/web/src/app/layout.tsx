import type { Metadata } from 'next';
import { DM_Sans, Noto_Sans_Tamil, Noto_Sans_Telugu, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const notoTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  variable: '--font-tamil',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const notoTelugu = Noto_Sans_Telugu({
  subsets: ['telugu'],
  variable: '--font-telugu',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-devanagari',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Kural Sevi — PM-AJAY GIA Livelihood Intelligence', template: '%s | Kural Sevi' },
  description: 'AI-driven voice assistant for livelihood mapping and NSQF-aligned skilling recommendations for SC communities under PM-AJAY GIA.',
  keywords: ['PM-AJAY', 'NSQF', 'livelihood', 'skilling', 'SC communities', 'GIA', 'Tamil Nadu', 'Voice AI'],
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${notoTamil.variable} ${notoTelugu.variable} ${notoDevanagari.variable}`}
    >
      <body className="font-sans antialiased bg-[var(--bg-base)] text-[var(--text-primary)] min-h-screen">
        {children}
      </body>
    </html>
  );
}
