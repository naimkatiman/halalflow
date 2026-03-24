import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "HalalFlow — Shariah Stock Intelligence",
  description: "Shariah-compliant stock screening for the modern Muslim investor. Real-time AAOIFI screening. 4,200+ equities covered.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-[100dvh] flex flex-col bg-[var(--background)] text-[var(--foreground)] antialiased">
        <Navbar />
        <main className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-zinc-200/50 py-5 text-center text-xs text-zinc-400">
          HalalFlow — Shariah Intelligence Terminal · Not financial advice · AAOIFI Methodology
        </footer>
      </body>
    </html>
  );
}
