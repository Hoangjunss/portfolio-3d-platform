import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-display-face',
});

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-body-face',
});

export const metadata: Metadata = {
  title: 'Sông Hồng Academy',
  description: 'Professional short courses and certificate programs for working adults.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${sourceSerif4.variable}`}>
      <body>{children}</body>
    </html>
  );
}
