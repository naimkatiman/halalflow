"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "@phosphor-icons/react";
import { useLocale } from "@/lib/i18n/provider";
import { THEME_COOKIE } from "@/lib/i18n";

// Reads the live <html> class rather than a prop so it always reflects the actual
// theme set by the SSR class or the no-flash ThemeScript. Renders a neutral
// placeholder until mounted to avoid a hydration mismatch on the icon.
export function ThemeToggle() {
  const { t } = useLocale();
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    document.cookie = `${THEME_COOKIE}=${next ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
    setIsDark(next);
  };

  const label = isDark ? t.toggle.toLight : t.toggle.toDark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid place-items-center w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 tap"
    >
      {isDark === null ? (
        <span className="w-4 h-4" aria-hidden="true" />
      ) : isDark ? (
        <Sun className="w-4 h-4" weight="bold" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4" weight="bold" aria-hidden="true" />
      )}
    </button>
  );
}
