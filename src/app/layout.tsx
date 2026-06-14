import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { isDemoMode } from "@/lib/demo";
import { getLocale, getTheme } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/provider";
import { ThemeScript } from "@/components/ThemeScript";

export const viewport: Viewport = {
  themeColor: "#059669",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: "MosRev — Islamic Finance Workflow",
  description: "Open-source workflow engine for Islamic finance operators, mosques, zakat organizations, and Muslim SMEs.",
  appleWebApp: {
    capable: true,
    title: "MosRev",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "MosRev — Islamic Finance Workflow",
    description: "Open-source workflow engine for Islamic finance operators, mosques, zakat organizations, and Muslim SMEs.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "MosRev — Islamic Finance Workflow",
    description: "Open-source workflow engine for Islamic finance operators, mosques, zakat organizations, and Muslim SMEs.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const theme = await getTheme();
  const t = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable}${theme === "dark" ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] flex flex-col bg-[var(--background)] text-[var(--foreground)] antialiased">
        <ThemeScript />
        <LocaleProvider initialLocale={locale}>
          <a
            href="#main-content"
            className="absolute -top-10 left-4 z-50 bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 px-4 py-2 rounded-lg shadow-lg ring-2 ring-emerald-500 font-medium text-sm transition-all focus:top-4"
          >
            {t.a11y.skipToContent}
          </a>
          {isDemoMode() && (
            <div className="bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs text-center px-4 py-1.5 border-b border-amber-100 dark:border-amber-900">
              {t.banner.demo}
            </div>
          )}
          <Navbar />
          <main id="main-content" tabIndex={-1} className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8 outline-none">
            {children}
          </main>
          <footer className="border-t border-zinc-200/50 dark:border-zinc-800/50 py-5 px-6">
            <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{t.common.appName} — {t.footer.tagline}</span>
              <div className="flex items-center gap-4">
                <a href="https://github.com/naimkatiman/halalflow" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors" aria-label={t.footer.githubAria}>{t.footer.github}</a>
                <span>{t.footer.openSource}</span>
              </div>
            </div>
          </footer>
        </LocaleProvider>
      </body>
    </html>
  );
}
