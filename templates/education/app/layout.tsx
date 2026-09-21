import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sông Hồng Academy',
  description: 'Professional short courses and certificate programs for working adults.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnamPro.className} ${sourceSerif4.className}`}>
      <body>{children}</body>
    </html>
  );
}
