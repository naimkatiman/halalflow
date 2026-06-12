import Link from "next/link";
import { Buildings, MoonStars, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export function CommunityBand() {
  return (
    <section className="animate-fade-up overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50 px-6 py-12 sm:px-12 sm:py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(5,150,105,0.05) 0 2px, transparent 2px 18px)",
        }}
      />
      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
            Komuniti masjid
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-emerald-950 sm:text-4xl">
            Hubung jemaah, pelawat dan komuniti
          </h2>
          <p className="mt-3 max-w-[48ch] text-base leading-relaxed text-emerald-800">
            Siarkan profil masjid, buka tempahan dewan, dan kongsikan program Ramadan — semua dalam satu platform yang mudah diurus.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/masjid"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:translate-y-px"
            >
              <Buildings className="h-4 w-4" aria-hidden="true" />
              Direktori Masjid
            </Link>
            <Link
              href="/ramadan"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white/60 px-5 py-2.5 text-sm font-semibold text-emerald-900 transition-colors hover:bg-white active:translate-y-px"
            >
              <MoonStars className="h-4 w-4" aria-hidden="true" />
              Direktori Ramadan
              <ArrowRight className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="relative h-64 lg:h-72 rounded-2xl overflow-hidden border border-emerald-100 shadow-lg">
          <img
            src="/images/mosque-exterior-1.jpg"
            alt="Luar masjid komuniti"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
