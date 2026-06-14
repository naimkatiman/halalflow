"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useLocale } from "@/lib/i18n/provider";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

// Segmented EN/MS control. Writes the cookie so SSR is correct on the next load,
// flips the provider for an instant client-side text swap, then refreshes so
// server components re-render in the new language.
export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();

  const choose = (next: Locale) => {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setLocale(next);
    router.refresh();
  };

  const options: { value: Locale; label: string }[] = [
    { value: "en", label: t.toggle.englishShort },
    { value: "ms", label: t.toggle.malayShort },
  ];

  return (
    <div
      role="group"
      aria-label={t.toggle.language}
      className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 text-xs font-semibold"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => choose(opt.value)}
          aria-pressed={locale === opt.value}
          className={clsx(
            "px-1.5 py-0.5 rounded-md tap",
            locale === opt.value
              ? "bg-emerald-600 text-white"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
