import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary } from "@/lib/i18n";

export function CtaBand({ t }: { t: Dictionary }) {
  const c = t.landing.cta;
  return (
    <section
      className="animate-fade-up overflow-hidden rounded-3xl bg-emerald-950 px-6 py-12 sm:px-12 sm:py-14 dark:border dark:border-emerald-900/60"
      style={{ ["--index" as string]: 4 }}
    >
      <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
        {c.heading}
      </h2>
      <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-emerald-200">
        {c.subtitle}
      </p>
      <Link
        href="/register"
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-50 active:translate-y-px"
      >
        {c.getStarted} <ArrowRight className="h-4 w-4" weight="bold" aria-hidden="true" />
      </Link>
    </section>
  );
}
