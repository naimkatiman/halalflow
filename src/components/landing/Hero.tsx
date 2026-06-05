import Link from "next/link";
import { ArrowRight, CheckCircle, Circle } from "@phosphor-icons/react/dist/ssr";

const previewSteps = [
  { name: "Eligibility verification", status: "Approved", done: true },
  { name: "Asnaf committee review", status: "Approved", done: true },
  { name: "Fund release authorization", status: "Pending", done: false },
];

export function Hero() {
  return (
    <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50 px-6 py-12 sm:px-12 sm:py-16">
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
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
            Islamic finance workflow engine
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-emerald-950 sm:text-5xl">
            Run your approvals
            <br className="hidden sm:block" /> the halal way
          </h1>
          <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-emerald-800">
            HalalFlow gives mosques, zakat bodies, cooperatives and Muslim SMEs one
            place to route, approve, and audit every multi-step financial decision.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:translate-y-px"
            >
              Get started <ArrowRight className="h-4 w-4" weight="bold" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg border border-emerald-300 bg-white/60 px-5 py-2.5 text-sm font-semibold text-emerald-900 transition-colors hover:bg-white active:translate-y-px"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-emerald-600">
            Open-source &middot; self-hostable &middot; no credit card
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_20px_45px_-15px_rgba(5,150,105,0.25)]">
          <p className="text-sm font-bold text-zinc-950">Zakat Distribution — Ramadan batch</p>
          <p className="mb-2 text-xs text-zinc-500">Al-Noor Mosque Trust</p>
          {previewSteps.map((step) => (
            <div
              key={step.name}
              className="flex items-center gap-2.5 border-t border-zinc-100 py-2.5"
            >
              {step.done ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" weight="fill" aria-hidden="true" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-amber-500" weight="bold" aria-hidden="true" />
              )}
              <span className="flex-1 text-xs text-zinc-900">{step.name}</span>
              <span
                className={
                  step.done
                    ? "text-[11px] font-semibold text-emerald-600"
                    : "text-[11px] font-semibold text-amber-600"
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
