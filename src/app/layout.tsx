import type { Metadata } from "next";
import { Archivo_Black, Cinzel, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sidescoin.com"),
  title: "SIDES — Flip first. Trade second.",
  description:
    "The two-faced coin on Base. Tap to trade the other side or hold and let the coin decide.",
  openGraph: {
    title: "SIDES — The two-faced coin on Base.",
    description: "Heads, price. Tails, volume. Flip first and trade either side.",
    url: "https://sidescoin.com",
    siteName: "SIDES",
    images: [{ url: "/og-sides.png", width: 1792, height: 1024 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SIDES — The two-faced coin on Base.",
    description: "Heads, price. Tails, volume. Flip first and trade either side.",
    images: ["/og-sides.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${archivoBlack.variable} ${cinzel.variable}`}>
      <body>{children}</body>
    </html>
  );
}
