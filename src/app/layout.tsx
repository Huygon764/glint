import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AutoReconnect } from "@/components/wallet/AutoReconnect";
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
  title: "Glint — Tipping on Stellar",
  description:
    "Micropayment tipping dApp on Stellar. Zero platform fees, instant settlement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AutoReconnect />
        {children}
      </body>
    </html>
  );
}
