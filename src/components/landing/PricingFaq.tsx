import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { PLAN_PRICE_LABEL } from "@/lib/billing-plan";
import type { Dictionary } from "@/lib/i18n";

export function PricingFaq({ t }: { t: Dictionary }) {
  const c = t.landing.pricing;
  return (
    <section
      id="pricing"
      className="animate-fade-up scroll-mt-20 rounded-3xl border border-zinc-200 bg-white px-6 py-10 sm:px-10 dark:border-zinc-800 dark:bg-zinc-900"
      style={{ ["--index" as string]: 3 }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">
        {c.eyebrow}
      </p>
      <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
        {c.heading}
      </h2>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">{c.planName}</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{c.planNote}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {c.planBody}
          </p>
          <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
            {c.thenPrefix} <span className="font-semibold text-zinc-950 dark:text-zinc-50">{PLAN_PRICE_LABEL}</span> {c.thenSuffix}
          </p>
          <ul className="mt-5 space-y-2.5">
            {c.included.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" weight="fill" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:translate-y-px"
          >
            {c.cta}
          </Link>
        </div>
        <div className="space-y-5">
          {c.faqs.map((faq) => (
            <div key={faq.q}>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{faq.q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
