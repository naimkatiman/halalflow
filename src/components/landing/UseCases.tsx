import { Mosque, HandHeart, Receipt, Coins } from "@phosphor-icons/react/dist/ssr";

const cases = [
  {
    icon: Mosque,
    title: "Mosque expense approvals",
    body: "Finance officer reviews, board signs off. Every ringgit traceable.",
    span: "md:col-span-4",
    featured: false,
  },
  {
    icon: HandHeart,
    title: "Donation acknowledgments",
    body: "Confirm receipt, issue the acknowledgment — one clean step.",
    span: "md:col-span-2",
    featured: false,
  },
  {
    icon: Receipt,
    title: "Invoice & payment approvals",
    body: "Multi-step sign-off before money moves.",
    span: "md:col-span-2",
    featured: false,
  },
  {
    icon: Coins,
    title: "Zakat distribution requests",
    body: "Eligibility check, asnaf committee review, treasurer release — the full chain, audited end to end.",
    span: "md:col-span-4",
    featured: true,
  },
];

export function UseCases() {
  return (
    <section
      id="use-cases"
      className="animate-fade-up scroll-mt-20"
      style={{ ["--index" as string]: 1 }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
        Use cases
      </p>
      <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
        One engine, every approval your team runs
      </h2>
      <div className="mt-6 grid gap-3 md:grid-cols-6">
        {cases.map(({ icon: Icon, title, body, span, featured }) => (
          <div
            key={title}
            className={[
              span,
              "rounded-2xl border p-6 transition-colors",
              featured
                ? "border-emerald-200 bg-emerald-50"
                : "border-zinc-200 bg-white hover:border-zinc-300",
            ].join(" ")}
          >
            <Icon
              className={featured ? "h-6 w-6 text-emerald-600" : "h-6 w-6 text-zinc-400"}
              weight="duotone"
              aria-hidden="true"
            />
            <h3
              className={
                featured
                  ? "mt-3 text-base font-bold text-emerald-950"
                  : "mt-3 text-base font-bold text-zinc-950"
              }
            >
              {title}
            </h3>
            <p
              className={
                featured
                  ? "mt-1 text-sm leading-relaxed text-emerald-800"
                  : "mt-1 text-sm leading-relaxed text-zinc-500"
              }
            >
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
