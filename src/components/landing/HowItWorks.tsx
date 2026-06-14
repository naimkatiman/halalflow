import { ClipboardText, PaperPlaneTilt, SealCheck } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary } from "@/lib/i18n";

// Icons parallel to t.landing.howItWorks.steps (translatable copy).
const icons = [ClipboardText, PaperPlaneTilt, SealCheck];

export function HowItWorks({ t }: { t: Dictionary }) {
  const c = t.landing.howItWorks;
  return (
    <section
      id="how-it-works"
      className="animate-fade-up scroll-mt-20 rounded-3xl border border-zinc-200 bg-white px-6 py-10 sm:px-10 dark:border-zinc-800 dark:bg-zinc-900"
      style={{ ["--index" as string]: 2 }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">
        {c.eyebrow}
      </p>
      <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
        {c.heading}
      </h2>
      <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-4">
        {c.steps.map((step, i) => {
          const Icon = icons[i];
          return (
            <div key={step.title} className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
                  {i + 1}
                </div>
                {i < c.steps.length - 1 && (
                  <div className="hidden h-px flex-1 bg-emerald-100 sm:block dark:bg-emerald-900/60" />
                )}
              </div>
              <Icon className="mt-4 h-5 w-5 text-emerald-600" weight="duotone" aria-hidden="true" />
              <h3 className="mt-2 text-base font-bold text-zinc-950 dark:text-zinc-50">{step.title}</h3>
              <p className="mt-1 max-w-[34ch] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {step.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
