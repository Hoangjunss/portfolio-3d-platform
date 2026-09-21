import type { Metadata } from 'next';
import theme from '../theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signal Form — Creative studio',
  description: 'Brand, product, and motion work for teams making useful things.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-accent-hue={theme.accentHue}><body>{children}</body></html>;
}
