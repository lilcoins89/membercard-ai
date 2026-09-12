import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "MemberCard AI — Membership cards, created by AI",
  description:
    "Create beautiful digital and physical membership cards without complicated setup.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${figtree.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
