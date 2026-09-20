import { Fraunces, EB_Garamond, Geist_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin", "vietnamese"], display: "swap", variable: "--font-display-face" });
const ebGaramond = EB_Garamond({ subsets: ["latin", "vietnamese"], display: "swap", variable: "--font-body-face" });
const geistMono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--font-wordmark-face" });

export const metadata = {
  title: "Portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${fraunces.variable} ${ebGaramond.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
