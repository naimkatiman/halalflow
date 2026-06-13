import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

const included = [
  "Unlimited workflows and templates",
  "Multi-step approvals with role requirements",
  "Full audit log on every request",
  "Member invitations and roles",
  "Template export and import (JSON)",
  "PDF receipts for approved requests",
];

const faqs = [
  {
    q: "Is our masjid's data kept separate from other organizations?",
    a: "Yes. Every workspace is isolated at the database level with row-level security — one organization can never read another's records, even by accident.",
  },
  {
    q: "Do we need a credit card to start?",
    a: "No. Every new workspace starts on a full-featured trial. You only set up billing when you decide to stay.",
  },
  {
    q: "Can we get our data out?",
    a: "Yes. Templates export as JSON you can re-import anywhere, and approved workflows produce PDF receipts for your records.",
  },
  {
    q: "Who is this for?",
    a: "Mosque committees, zakat bodies, cooperatives, and Muslim SMEs — any team that needs money decisions reviewed, approved, and recorded.",
  },
];

export function PricingFaq() {
  return (
    <section
      id="pricing"
      className="animate-fade-up scroll-mt-20 rounded-3xl border border-zinc-200 bg-white px-6 py-10 sm:px-10"
      style={{ ["--index" as string]: 3 }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
        Pricing
      </p>
      <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
        Start free, stay when it earns its keep
      </h2>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-950">Free trial</span>
            <span className="text-sm text-zinc-500">for every new workspace</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Full access, no credit card. One simple subscription per workspace
            when your committee is ready — cancel anytime.
          </p>
          <ul className="mt-5 space-y-2.5">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" weight="fill" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:translate-y-px"
          >
            Create your workspace
          </Link>
        </div>
        <div className="space-y-5">
          {faqs.map(({ q, a }) => (
            <div key={q}>
              <h3 className="text-sm font-bold text-zinc-950">{q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
