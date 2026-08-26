import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sidescoin.com"),
  title: "SIDES — One market. Two ways in.",
  description:
    "Flip between SIDES price exposure and lpSIDES liquidity exposure on Base.",
  openGraph: {
    title: "SIDES — Every coin has two sides.",
    description: "The token and the liquidity behind it, on Base.",
    url: "https://sidescoin.com",
    siteName: "SIDES",
    images: [{ url: "/og-sides.png", width: 1792, height: 1024 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SIDES — Every coin has two sides.",
    description: "The token and the liquidity behind it, on Base.",
    images: ["/og-sides.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
