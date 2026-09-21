import type { Metadata } from 'next';
import { Big_Shoulders, IBM_Plex_Sans } from 'next/font/google';
import theme from '../theme';
import './globals.css';

const display = Big_Shoulders({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display-loaded' });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body-loaded' });

export const metadata: Metadata = {
  title: 'Signal Form — Creative studio',
  description: 'Brand, product, and motion work for teams making useful things.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-accent-hue={theme.accentHue} className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
