import type { Metadata } from "next";
import Link from "next/link";
import { MoonStars, ForkKnife, Coffee, BookOpen, Star, CookingPot, MapPin } from "@phosphor-icons/react/dist/ssr";
import { getRamadanDirectory } from "@/lib/public-directory";
import { MALAYSIAN_STATES } from "@/lib/states";
import { RAMADAN_TYPES, RAMADAN_TYPE_LABELS } from "@/lib/community";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Direktori Ramadan — MosRev",
  description: "Cari di mana untuk berbuka, moreh, terawih dan program Ramadan di seluruh Malaysia.",
};

const TYPE_ICONS = {
  iftar: ForkKnife,
  moreh: Coffee,
  terawih: MoonStars,
  tadarus: BookOpen,
  qiyamullail: Star,
  bubur_lambuk: CookingPot,
} as const;

export default async function RamadanPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state: rawState } = await searchParams;
  const validState =
    rawState && (MALAYSIAN_STATES as readonly string[]).includes(rawState) ? rawState : undefined;

  const programs = await getRamadanDirectory({ state: validState });

  const grouped = RAMADAN_TYPES.map((type) => ({
    type,
    label: RAMADAN_TYPE_LABELS[type] ?? type,
    icon: TYPE_ICONS[type],
    items: programs.filter((p) => p.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50 px-6 py-10 sm:px-12 sm:py-14 mb-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(5,150,105,0.06) 0 2px, transparent 2px 18px), repeating-linear-gradient(-45deg, rgba(5,150,105,0.06) 0 2px, transparent 2px 18px)" }}
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Ramadan</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-emerald-950 sm:text-5xl">Direktori Ramadan</h1>
          <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-emerald-800">Cari di mana untuk berbuka, moreh, terawih dan program Ramadan di seluruh Malaysia.</p>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Link href="/ramadan" className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${!validState ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-zinc-600 border-zinc-200 hover:border-emerald-300 hover:text-emerald-700"}`}>Semua</Link>
          {MALAYSIAN_STATES.map((s) => (
            <Link key={s} href={`/ramadan?state=${encodeURIComponent(s)}`} className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${validState === s ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-zinc-600 border-zinc-200 hover:border-emerald-300 hover:text-emerald-700"}`}>{s}</Link>
          ))}
        </div>

        {programs.length === 0 ? (
          <EmptyState
            icon={MoonStars}
            title="Tiada program Ramadan dijumpai"
            description={validState ? `Belum ada program Ramadan yang disiarkan di ${validState}.` : "Belum ada program Ramadan yang disiarkan."}
          />
        ) : (
          <div className="space-y-10">
            {grouped.map(({ type, label, icon: TypeIcon, items }) => (
              <section key={type}>
                <div className="flex items-center gap-2 mb-4">
                  <TypeIcon className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                  <h2 className="text-xl font-bold text-emerald-950 tracking-tight">{label}</h2>
                  <span className="text-xs text-zinc-400 ml-1">{items.length} masjid</span>
                </div>
                <div className="bg-white border border-zinc-200/70 rounded-xl divide-y divide-zinc-100">
                  {items.map((program, i) => {
                    const mosque = program.org.mosqueProfile;
                    return (
                      <div key={i} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <Link href={`/masjid/${program.org.slug}`} className="font-medium text-sm text-zinc-950 hover:text-emerald-700 transition-colors">
                              {mosque?.displayName ?? program.org.slug}
                            </Link>
                            {mosque && (
                              <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                                <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                                <span>{mosque.city ? `${mosque.city} · ` : ""}{mosque.state}</span>
                              </div>
                            )}
                            <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{program.description}</p>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-400">
                              {program.time && <span>{program.time}</span>}
                              {program.schedule && <span>{program.schedule}</span>}
                              {program.sponsorName && <span>Tajaan: {program.sponsorName}</span>}
                            </div>
                          </div>
                          {program.isFree && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5 shrink-0">Percuma</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}