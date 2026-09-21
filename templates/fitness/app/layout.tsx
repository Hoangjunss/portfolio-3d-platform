import type { Metadata } from 'next';
import { Barlow, Work_Sans } from 'next/font/google';
import './globals.css';

const barlow = Barlow({
  weight: ['400', '600', '800', '900'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-display-face',
});

const workSans = Work_Sans({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-body-face',
});

export const metadata: Metadata = {
  title: 'Iron Line Fitness',
  description: 'Class schedule, trainers, and membership plans for a boutique strength & conditioning gym.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${barlow.variable} ${workSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
