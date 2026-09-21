import type { Metadata } from 'next';
import { Cormorant_Garamond, Mulish } from 'next/font/google';
import './globals.css';

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-display-face',
});

const mulish = Mulish({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-body-face',
});

export const metadata: Metadata = {
  title: 'Nguyễn Hoàng Minh & Đặng Thanh Hà — Lễ Thành Hôn',
  description: 'Trân trọng kính mời bạn đến dự lễ thành hôn tại Ngọc Lan Garden Hall, TP. Thủ Đức.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${cormorantGaramond.variable} ${mulish.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
