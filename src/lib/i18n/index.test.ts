import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  getDictionary,
  isLocale,
  parseAcceptLanguage,
} from "./index";

describe("parseAcceptLanguage", () => {
  it("returns the default locale when the header is empty or missing", () => {
    expect(parseAcceptLanguage(null)).toBe(DEFAULT_LOCALE);
    expect(parseAcceptLanguage(undefined)).toBe(DEFAULT_LOCALE);
    expect(parseAcceptLanguage("")).toBe(DEFAULT_LOCALE);
  });

  it("detects Malay from a region-tagged preferred language", () => {
    expect(parseAcceptLanguage("ms-MY,ms;q=0.9,en;q=0.8")).toBe("ms");
    expect(parseAcceptLanguage("ms")).toBe("ms");
  });

  it("detects English", () => {
    expect(parseAcceptLanguage("en-US,en;q=0.9")).toBe("en");
  });

  it("picks the highest quality-value match across supported languages", () => {
    expect(parseAcceptLanguage("en;q=0.7,ms;q=0.9")).toBe("ms");
    expect(parseAcceptLanguage("ms;q=0.4,en;q=0.8")).toBe("en");
  });

  it("ignores unsupported languages and falls back to default", () => {
    expect(parseAcceptLanguage("fr-FR,de;q=0.9")).toBe(DEFAULT_LOCALE);
  });

  it("falls back to default when an unsupported language outranks a supported one", () => {
    // fr has higher q but is unsupported; ms is the best supported match.
    expect(parseAcceptLanguage("fr;q=1.0,ms;q=0.5")).toBe("ms");
  });

  it("treats a malformed quality value as lowest priority", () => {
    expect(parseAcceptLanguage("ms;q=abc,en;q=0.5")).toBe("en");
  });
});

describe("isLocale", () => {
  it("accepts supported locales only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ms")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});

describe("getDictionary", () => {
  it("returns a dictionary whose keys match across locales", () => {
    const en = getDictionary("en");
    const ms = getDictionary("ms");
    expect(Object.keys(en)).toEqual(Object.keys(ms));
    expect(en.nav.dashboard).toBe("Dashboard");
    expect(ms.nav.dashboard).toBe("Papan Pemuka");
  });

  it("renders interpolated trial strings per locale", () => {
    expect(getDictionary("en").nav.trialDaysLeft(3)).toBe("Trial · 3d left");
    expect(getDictionary("ms").nav.trialDaysLeft(3)).toBe("Percubaan · 3h lagi");
  });
});
