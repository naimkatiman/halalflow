// Pure i18n core — no `next/headers`, so it is safe to import from client
// components, server components, and tests alike. Request-time resolution lives in
// ./server.ts.
import { en, type Dictionary } from "./dictionaries/en";
import { ms } from "./dictionaries/ms";

export type Locale = "en" | "ms";
export type Theme = "light" | "dark";

export const LOCALE_COOKIE = "locale";
export const THEME_COOKIE = "theme";

// Ultimate fallback when Accept-Language matches neither supported language.
export const DEFAULT_LOCALE: Locale = "en";

export const dictionaries: Record<Locale, Dictionary> = { en, ms };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ms";
}

// Picks the best supported locale from an Accept-Language header by quality value.
// Example: "ms-MY,ms;q=0.9,en-US;q=0.8" -> "ms". Pure and unit-tested.
export function parseAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  let best: { locale: Locale; q: number } | null = null;

  for (const part of header.split(",")) {
    const [rawTag, ...params] = part.trim().split(";");
    const base = rawTag.trim().toLowerCase().split("-")[0];
    if (base !== "en" && base !== "ms") continue;

    const qParam = params.find((p) => p.trim().startsWith("q="));
    const parsed = qParam ? Number.parseFloat(qParam.split("=")[1]) : 1;
    const q = Number.isFinite(parsed) ? parsed : 0;

    if (!best || q > best.q) best = { locale: base, q };
  }

  return best ? best.locale : DEFAULT_LOCALE;
}

export type { Dictionary };
