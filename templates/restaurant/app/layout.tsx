import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ember & Sage',
  description: 'Modern hearth cooking, seasonal plates, and a wood-fired kitchen you can watch work.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
