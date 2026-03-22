import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HalalFlow — Shariah Stock Intelligence Terminal",
  description: "Bloomberg-lite for Muslim investors. Shariah screening, compliance breakdown, and research for global equities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#0a0e1a] text-slate-100 antialiased">
        <Navbar />
        <main className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-6">
          {children}
        </main>
        <footer className="border-t border-white/5 py-4 text-center text-xs text-slate-600">
          HalalFlow — Shariah Intelligence Terminal &nbsp;·&nbsp; Not financial advice &nbsp;·&nbsp; AAOIFI Methodology
        </footer>
      </body>
    </html>
  );
}
