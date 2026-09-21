import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sông Hồng Real Estate',
  description: 'Curated apartment, townhouse, villa, and land listings across Vietnam.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
