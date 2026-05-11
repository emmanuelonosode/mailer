import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Hasker & Co. | Email Campaign Sender",
  description: "Internal email marketing tool for Hasker & Co. Realty Group",
};

import { validateEnv } from "@/lib/env";

// Validate env vars on startup
validateEnv();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="bg-navy font-sans antialiased">{children}</body>
    </html>
  );
}
