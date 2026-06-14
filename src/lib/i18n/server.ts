// Request-time locale/theme resolution. Imports `next/headers`, so this is
// server-only — never import it from a client component.
import { cookies, headers } from "next/headers";
import {
  LOCALE_COOKIE,
  THEME_COOKIE,
  isLocale,
  parseAcceptLanguage,
  type Locale,
  type Theme,
} from "./index";

// Cookie wins; otherwise auto-detect from Accept-Language on first visit.
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const headerStore = await headers();
  return parseAcceptLanguage(headerStore.get("accept-language"));
}

// The server cannot read prefers-color-scheme; light is the SSR default and the
// inline ThemeScript upgrades a cookieless first paint to the system preference.
export async function getTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  return cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";
}
