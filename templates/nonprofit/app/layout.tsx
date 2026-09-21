import type { Metadata } from 'next';
import { Bitter, Source_Sans_3 } from 'next/font/google';
import './globals.css';

const bitter = Bitter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-display-face',
});

const sourceSans3 = Source_Sans_3({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-body-face',
});

export const metadata: Metadata = {
  title: 'Mái Ấm Bình Minh Foundation',
  description: 'Scholarships, nutrition, and emergency support for children and families across rural Vietnam.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${bitter.variable} ${sourceSans3.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
