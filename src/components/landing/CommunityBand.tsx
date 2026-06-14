import Link from "next/link";
import { Buildings, MoonStars, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary } from "@/lib/i18n";

export function CommunityBand({ t }: { t: Dictionary }) {
  const c = t.landing.community;
  return (
    <section className="relative animate-fade-up overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50 px-6 py-12 sm:px-12 sm:py-14 dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(5,150,105,0.05) 0 2px, transparent 2px 18px)",
        }}
      />
      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">
            {c.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-emerald-950 sm:text-4xl dark:text-emerald-50">
            {c.heading}
          </h2>
          <p className="mt-3 max-w-[48ch] text-base leading-relaxed text-emerald-800 dark:text-emerald-200">
            {c.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/masjid"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:translate-y-px"
            >
              <Buildings className="h-4 w-4" aria-hidden="true" />
              {c.directory}
            </Link>
            <Link
              href="/ramadan"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white/60 px-5 py-2.5 text-sm font-semibold text-emerald-900 transition-colors hover:bg-white active:translate-y-px dark:border-emerald-700 dark:bg-white/5 dark:text-emerald-100 dark:hover:bg-white/10"
            >
              <MoonStars className="h-4 w-4" aria-hidden="true" />
              {c.ramadan}
              <ArrowRight className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="relative h-64 lg:h-72 rounded-2xl overflow-hidden border border-emerald-100 shadow-lg dark:border-emerald-900/50">
          <img
            src="/images/mosque-exterior-1.jpg"
            alt={c.imageAlt}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
