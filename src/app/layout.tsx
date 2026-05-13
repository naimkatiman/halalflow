import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "HalalFlow — Islamic Finance Workflow",
  description: "Open-source workflow engine for Islamic finance operators, mosques, zakat organizations, and Muslim SMEs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-[100dvh] flex flex-col bg-[var(--background)] text-[var(--foreground)] antialiased">
        <Navbar />
        <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-zinc-200/50 py-5 px-6">
          <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-400">
            <span>HalalFlow — Islamic Finance Workflow Engine</span>
            <div className="flex items-center gap-4">
              <a href="https://github.com/naimkatiman/halalflow" className="hover:text-zinc-600 transition-colors">GitHub</a>
              <span>Open Source</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
