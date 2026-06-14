import Link from "next/link";
import { ArrowRight, CheckCircle, Circle } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary } from "@/lib/i18n";

// Which preview steps are complete (parallel to t.landing.hero.steps).
const stepDone = [true, true, false];

export function Hero({ t }: { t: Dictionary }) {
  const c = t.landing.hero;
  return (
    <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50 px-6 py-12 sm:px-12 sm:py-16 dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(5,150,105,0.06) 0 2px, transparent 2px 18px), repeating-linear-gradient(-45deg, rgba(5,150,105,0.06) 0 2px, transparent 2px 18px)",
        }}
      />
      <div className="relative grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">
            {c.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-emerald-950 sm:text-5xl dark:text-emerald-50">
            {c.titleLine1}
            <br className="hidden sm:block" /> {c.titleLine2}
          </h1>
          <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-emerald-800 dark:text-emerald-200">
            {c.subtitle}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:translate-y-px"
            >
              {c.getStarted} <ArrowRight className="h-4 w-4" weight="bold" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg border border-emerald-300 bg-white/60 px-5 py-2.5 text-sm font-semibold text-emerald-900 transition-colors hover:bg-white active:translate-y-px dark:border-emerald-700 dark:bg-white/5 dark:text-emerald-100 dark:hover:bg-white/10"
            >
              {c.signIn}
            </Link>
          </div>
          <p className="mt-4 text-xs text-emerald-700 dark:text-emerald-400">
            {c.badges}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_20px_45px_-15px_rgba(5,150,105,0.25)] dark:border-emerald-900/50 dark:bg-zinc-900">
          <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{c.previewTitle}</p>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{c.previewOrg}</p>
          {c.steps.map((step, i) => (
            <div
              key={step.name}
              className="flex items-center gap-2.5 border-t border-zinc-100 py-2.5 dark:border-zinc-800"
            >
              {stepDone[i] ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" weight="fill" aria-hidden="true" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-amber-500" weight="bold" aria-hidden="true" />
              )}
              <span className="flex-1 text-xs text-zinc-900 dark:text-zinc-100">{step.name}</span>
              <span
                className={
                  stepDone[i]
                    ? "text-[11px] font-semibold text-emerald-700 dark:text-emerald-400"
                    : "text-[11px] font-semibold text-amber-700 dark:text-amber-400"
                }
              >
                {step.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
