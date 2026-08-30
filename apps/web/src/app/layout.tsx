import type { Metadata } from 'next';
import { Inter, Noto_Sans } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoSans = Noto_Sans({
  subsets: ['latin', 'devanagari'],
  variable: '--font-noto',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: { default: 'Kural Sevi — PM-AJAY GIA Livelihood Intelligence', template: '%s | Kural Sevi' },
  description: 'AI-driven voice assistant for livelihood mapping and NSQF-aligned skilling recommendations for SC communities under PM-AJAY GIA.',
  keywords: ['PM-AJAY', 'NSQF', 'livelihood', 'skilling', 'SC communities', 'GIA'],
  robots: { index: false, follow: false }, // Government tool — no public indexing
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
