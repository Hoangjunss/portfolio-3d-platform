import type { Metadata } from 'next';
import { JetBrains_Mono, Lexend } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-display-face',
});

const lexend = Lexend({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-body-face',
});

export const metadata: Metadata = {
  title: 'Thiên Trường Construction & Architecture',
  description: 'Residential, commercial, and renovation construction with in-house architectural design.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${jetbrainsMono.variable} ${lexend.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
