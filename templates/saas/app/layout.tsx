import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Loopwire — Workflow automation for teams',
  description: 'Loopwire demo site — a fictional SaaS product built for the template kit.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
