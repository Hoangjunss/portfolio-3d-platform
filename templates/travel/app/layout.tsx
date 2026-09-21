import type { Metadata } from 'next';
import { Playfair_Display, Manrope } from 'next/font/google';
import './globals.css';

const playfairDisplay = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-display-face',
});

const manrope = Manrope({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-body-face',
});

export const metadata: Metadata = {
  title: 'Vịnh Ngọc Resort & Spa',
  description: 'A coastal resort on Vịnh Ngọc Bay, Khánh Hòa — rooms, packages, and amenities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${playfairDisplay.variable} ${manrope.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
