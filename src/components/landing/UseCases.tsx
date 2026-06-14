import { Mosque, HandHeart, Receipt, Coins } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary } from "@/lib/i18n";

// Presentation metadata, parallel to t.landing.useCases.items (translatable copy).
const layout = [
  { icon: Mosque, span: "md:col-span-4", featured: false },
  { icon: HandHeart, span: "md:col-span-2", featured: false },
  { icon: Receipt, span: "md:col-span-2", featured: false },
  { icon: Coins, span: "md:col-span-4", featured: true },
];

export function UseCases({ t }: { t: Dictionary }) {
  const c = t.landing.useCases;
  return (
    <section
      id="use-cases"
      className="animate-fade-up scroll-mt-20"
      style={{ ["--index" as string]: 1 }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">
        {c.eyebrow}
      </p>
      <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
        {c.heading}
      </h2>
      <div className="mt-6 grid gap-3 md:grid-cols-6">
        {c.items.map((item, i) => {
          const { icon: Icon, span, featured } = layout[i];
          return (
            <div
              key={item.title}
              className={[
                span,
                "rounded-2xl border p-6 transition-colors",
                featured
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
              ].join(" ")}
            >
              <Icon
                className={featured ? "h-6 w-6 text-emerald-600" : "h-6 w-6 text-zinc-400 dark:text-zinc-500"}
                weight="duotone"
                aria-hidden="true"
              />
              <h3
                className={
                  featured
                    ? "mt-3 text-base font-bold text-emerald-950 dark:text-emerald-50"
                    : "mt-3 text-base font-bold text-zinc-950 dark:text-zinc-50"
                }
              >
                {item.title}
              </h3>
              <p
                className={
                  featured
                    ? "mt-1 text-sm leading-relaxed text-emerald-800 dark:text-emerald-200"
                    : "mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400"
                }
              >
                {item.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
