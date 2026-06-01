import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const viewport: Viewport = {
  themeColor: "#059669",
};

export const metadata: Metadata = {
  title: "HalalFlow — Islamic Finance Workflow",
  description: "Open-source workflow engine for Islamic finance operators, mosques, zakat organizations, and Muslim SMEs.",
  appleWebApp: {
    capable: true,
    title: "HalalFlow",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "HalalFlow — Islamic Finance Workflow",
    description: "Open-source workflow engine for Islamic finance operators, mosques, zakat organizations, and Muslim SMEs.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "HalalFlow — Islamic Finance Workflow",
    description: "Open-source workflow engine for Islamic finance operators, mosques, zakat organizations, and Muslim SMEs.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-[100dvh] flex flex-col bg-[var(--background)] text-[var(--foreground)] antialiased">
        <a
          href="#main-content"
          className="absolute -top-10 left-4 z-50 bg-white text-zinc-900 px-4 py-2 rounded-lg shadow-lg ring-2 ring-emerald-500 font-medium text-sm transition-all focus:top-4"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8 outline-none">
          {children}
        </main>
        <footer className="border-t border-zinc-200/50 py-5 px-6">
          <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-400">
            <span>HalalFlow — Islamic Finance Workflow Engine</span>
            <div className="flex items-center gap-4">
              <a href="https://github.com/naimkatiman/halalflow" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 transition-colors" aria-label="HalalFlow GitHub repository (opens in new tab)">GitHub</a>
              <span>Open Source</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
