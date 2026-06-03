import { ClipboardText, PaperPlaneTilt, SealCheck } from "@phosphor-icons/react/dist/ssr";

const steps = [
  {
    n: 1,
    icon: ClipboardText,
    title: "Build a template",
    body: "Define the ordered steps once — who reviews, who signs off.",
  },
  {
    n: 2,
    icon: PaperPlaneTilt,
    title: "Submit a workflow",
    body: "Anyone on the team starts one from a template in seconds.",
  },
  {
    n: 3,
    icon: SealCheck,
    title: "Approve & audit",
    body: "Step-by-step sign-off. Every action lands in the audit log.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="animate-fade-up scroll-mt-20 rounded-3xl border border-zinc-200 bg-white px-6 py-10 sm:px-10"
      style={{ ["--index" as string]: 2 }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-600">
        How it works
      </p>
      <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
        Three steps from request to record
      </h2>
      <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-4">
        {steps.map(({ n, icon: Icon, title, body }, i) => (
          <div key={n} className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
                {n}
              </div>
              {i < steps.length - 1 && (
                <div className="hidden h-px flex-1 bg-emerald-100 sm:block" />
              )}
            </div>
            <Icon className="mt-4 h-5 w-5 text-emerald-600" weight="duotone" aria-hidden="true" />
            <h3 className="mt-2 text-base font-bold text-zinc-950">{title}</h3>
            <p className="mt-1 max-w-[34ch] text-sm leading-relaxed text-zinc-500">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
