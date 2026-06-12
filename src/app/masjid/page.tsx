import type { Metadata } from "next";
import Link from "next/link";
import { Buildings, MapPin, CookingPot, HandHeart, MoonStars } from "@phosphor-icons/react/dist/ssr";
import { getPublishedMosques } from "@/lib/public-directory";
import { MALAYSIAN_STATES } from "@/lib/states";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Direktori Masjid — MosRev",
  description:
    "Cari masjid untuk sewaan dewan, program Ramadan, ziarah dan pantri komuniti.",
};

export default async function MasjidDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state: rawState } = await searchParams;
  const validState =
    rawState && (MALAYSIAN_STATES as readonly string[]).includes(rawState)
      ? rawState
      : undefined;

  const mosques = await getPublishedMosques({ state: validState });

  return (
    <div>
      {/* Page header */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50 px-6 py-10 sm:px-12 sm:py-14 mb-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(5,150,105,0.06) 0 2px, transparent 2px 18px), repeating-linear-gradient(-45deg, rgba(5,150,105,0.06) 0 2px, transparent 2px 18px)",
          }}
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
            Komuniti
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-emerald-950 sm:text-5xl">
            Direktori Masjid
          </h1>
          <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-emerald-800">
            Cari masjid untuk sewaan dewan, program Ramadan, ziarah dan pantri komuniti.
          </p>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-16">
        {/* State filter */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Link
            href="/masjid"
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              !validState
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-emerald-300 hover:text-emerald-700"
            }`}
          >
            Semua
          </Link>
          {MALAYSIAN_STATES.map((s) => (
            <Link
              key={s}
              href={`/masjid?state=${encodeURIComponent(s)}`}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                validState === s
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {mosques.length === 0 ? (
          <EmptyState
            icon={Buildings}
            title="Tiada masjid dijumpai"
            description={
              validState
                ? `Belum ada masjid yang disiarkan di ${validState}.`
                : "Belum ada masjid yang disiarkan dalam direktori ini."
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mosques.map((mosque) => {
              const slug = mosque.org.slug;
              const hasFacilities = mosque.org.facilities.length > 0;
              const hasFreeIftar = mosque.org.ramadanPrograms.some(
                (p) => p.type === "iftar" && p.isFree,
              );
              const welcomesVisitors = mosque.visitorsWelcome;
              const hasPantry = mosque.pantryAvailable;

              return (
                <Link
                  key={slug}
                  href={`/masjid/${slug}`}
                  className="group bg-white border border-zinc-200/70 rounded-xl overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all"
                >
                  <div className="h-44 overflow-hidden">
                    <img
                      src={mosque.photoUrl ?? "/images/mosque-exterior-2.jpg"}
                      alt={`Foto ${mosque.displayName}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="font-semibold text-zinc-950 text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                      {mosque.displayName}
                    </h2>
                    <div className="flex items-center gap-1 mt-1 text-xs text-zinc-400">
                      <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>
                        {mosque.city ? `${mosque.city} · ` : ""}
                        {mosque.state}
                      </span>
                    </div>
                    {(hasFacilities || hasFreeIftar || welcomesVisitors || hasPantry) && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {hasFacilities && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5">
                            <Buildings className="w-3 h-3" aria-hidden="true" />
                            Dewan untuk disewa
                          </span>
                        )}
                        {hasFreeIftar && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5">
                            <MoonStars className="w-3 h-3" aria-hidden="true" />
                            Iftar percuma
                          </span>
                        )}
                        {welcomesVisitors && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5">
                            <HandHeart className="w-3 h-3" aria-hidden="true" />
                            Pelawat dialu-alukan
                          </span>
                        )}
                        {hasPantry && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5">
                            <CookingPot className="w-3 h-3" aria-hidden="true" />
                            Pantri komuniti
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
