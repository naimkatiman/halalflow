import { MapPin } from "@phosphor-icons/react/dist/ssr";

const masjids = [
  {
    src: "/images/mosque-hero.jpg",
    name: "Masjid Wilayah Persekutuan",
    location: "Kuala Lumpur",
  },
  {
    src: "/images/mosque-exterior-2.jpg",
    name: "Masjid Sultan Salahuddin Abdul Aziz Shah",
    location: "Shah Alam, Selangor",
  },
  {
    src: "/images/mosque-exterior-1.jpg",
    name: "Masjid As-Salam",
    location: "Puchong, Selangor",
  },
];

export function MasjidGallery() {
  return (
    <section className="animate-fade-up">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
        Masjid di KL &amp; Selangor
      </p>
      <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
        Dipercayai komuniti sekitar Lembah Klang
      </h2>
      <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-zinc-500">
        Daripada Masjid Wilayah Persekutuan di Kuala Lumpur hingga Masjid Biru
        di Shah Alam — uruskan kewangan dan tempahan masjid anda dalam satu platform.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {masjids.map((masjid) => (
          <figure
            key={masjid.name}
            className="group relative h-64 overflow-hidden rounded-2xl border border-emerald-100 shadow-sm"
          >
            <img
              src={masjid.src}
              alt={`${masjid.name}, ${masjid.location}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
            />
            <figcaption className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-sm font-bold leading-snug text-white">{masjid.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-emerald-100">
                <MapPin className="h-3.5 w-3.5 shrink-0" weight="fill" aria-hidden="true" />
                {masjid.location}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
