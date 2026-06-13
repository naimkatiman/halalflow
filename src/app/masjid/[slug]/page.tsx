import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, WhatsappLogo, UsersThree, Buildings, MoonStars, HandHeart, CookingPot, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getMosqueBySlug } from "@/lib/public-directory";
import { FACILITY_TYPE_LABELS } from "@/lib/bookings";
import { RAMADAN_TYPE_LABELS, PANTRY_TYPE_LABELS } from "@/lib/community";
import { formatMYR } from "@/lib/money";
import { FreshnessStamp } from "@/components/ui/FreshnessStamp";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const org = await getMosqueBySlug(slug);
  if (!org?.mosqueProfile) return { title: "Masjid — MosRev" };
  return { title: `${org.mosqueProfile.displayName} — MosRev`, description: org.mosqueProfile.description ?? undefined };
}

function sanitizePhone(raw: string): string { return raw.replace(/[^+\d]/g, ""); }

export default async function MasjidProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getMosqueBySlug(slug);
  if (!org) notFound();
  const profile = org.mosqueProfile!;
  const phoneDigits = profile.phone ? sanitizePhone(profile.phone) : "";
  const waDigits = profile.whatsapp ? profile.whatsapp.replace(/\D/g, "") : "";
  return (
    <div className="max-w-screen-lg mx-auto px-4 sm:px-6 pb-20">
      <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-8 mt-4">
        <img src={profile.photoUrl ?? "/images/mosque-exterior-2.jpg"} alt={`Foto luar ${profile.displayName}`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{profile.displayName}</h1>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-emerald-100">
            <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{profile.address ? `${profile.address}, ` : ""}{profile.city ? `${profile.city}, ` : ""}{profile.state}</span>
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_auto] gap-6 mb-10">
        <div>{profile.description && <p className="text-zinc-700 leading-relaxed">{profile.description}</p>}</div>
        <div className="flex flex-col gap-2 shrink-0">
          {profile.phone && (phoneDigits ? (
            <a href={`tel:${phoneDigits}`} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"><Phone className="w-4 h-4 shrink-0" aria-hidden="true" />{profile.phone}</a>
          ) : <span className="inline-flex items-center gap-2 text-sm text-zinc-600"><Phone className="w-4 h-4 shrink-0" aria-hidden="true" />{profile.phone}</span>)}
          {profile.whatsapp && (waDigits ? (
            <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"><WhatsappLogo className="w-4 h-4 shrink-0" aria-hidden="true" />WhatsApp</a>
          ) : <span className="inline-flex items-center gap-2 text-sm text-zinc-600"><WhatsappLogo className="w-4 h-4 shrink-0" aria-hidden="true" />{profile.whatsapp}</span>)}
        </div>
      </div>
      <div className="space-y-10">
        {org.facilities.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Buildings className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              <h2 className="text-xl font-bold text-emerald-950 tracking-tight">Sewaan Fasiliti</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {org.facilities.map((facility) => (
                <div key={facility.id} className="bg-white border border-zinc-200/70 rounded-xl overflow-hidden">
                  <div className="h-40 overflow-hidden">
                    <img src={facility.photoUrl ?? "/images/mosque-hall.jpg"} alt={`Foto ${facility.name}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-zinc-950 text-sm">{facility.name}</h3>
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5 shrink-0">{FACILITY_TYPE_LABELS[facility.type] ?? facility.type}</span>
                    </div>
                    {facility.capacity > 0 && <div className="flex items-center gap-1 text-xs text-zinc-500 mb-2"><UsersThree className="w-3.5 h-3.5" aria-hidden="true" /><span>Kapasiti {facility.capacity} pax</span></div>}
                    {facility.description && <p className="text-xs text-zinc-600 mb-3 leading-relaxed">{facility.description}</p>}
                    <div className="space-y-0.5 text-xs text-zinc-700 mb-2">
                      {facility.rateKariah > 0 && <div>Ahli kariah <span className="font-semibold">{formatMYR(facility.rateKariah)}</span></div>}
                      {facility.rateAwam > 0 && <div>Awam <span className="font-semibold">{formatMYR(facility.rateAwam)}</span></div>}
                      {facility.deposit > 0 && <div>Deposit <span className="font-semibold">{formatMYR(facility.deposit)}</span></div>}
                      {facility.rateNote && <div className="text-zinc-400">{facility.rateNote}</div>}
                    </div>
                    {facility.rules && <p className="text-xs text-zinc-500 leading-relaxed mb-3 border-t border-zinc-100 pt-2">{facility.rules}</p>}
                    <Link href={`/masjid/${slug}/book?facility=${facility.id}`} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                      Mohon Tempahan<ArrowRight className="w-3 h-3" weight="bold" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3"><FreshnessStamp date={profile.updatedAt} /></div>
          </section>
        )}
        {org.ramadanPrograms.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MoonStars className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              <h2 className="text-xl font-bold text-emerald-950 tracking-tight">Program Ramadan</h2>
            </div>
            <div className="bg-white border border-zinc-200/70 rounded-xl divide-y divide-zinc-100">
              {org.ramadanPrograms.map((program, i) => (
                <div key={i} className="p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5">{RAMADAN_TYPE_LABELS[program.type] ?? program.type}</span>
                    {program.isFree && <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5">Percuma</span>}
                  </div>
                  {program.title && <p className="text-sm font-medium text-zinc-900 mb-1">{program.title}</p>}
                  <p className="text-sm text-zinc-600 leading-relaxed">{program.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-400">
                    {program.time && <span>{program.time}</span>}
                    {program.schedule && <span>{program.schedule}</span>}
                    {program.sponsorName && <span>Tajaan: {program.sponsorName}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3"><FreshnessStamp date={profile.updatedAt} /></div>
          </section>
        )}
        {profile.visitorsWelcome && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <HandHeart className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              <h2 className="text-xl font-bold text-emerald-950 tracking-tight">Ziarah</h2>
            </div>
            <div className="bg-white border border-zinc-200/70 rounded-xl p-5 space-y-2 text-sm text-zinc-700">
              {profile.visitorHours && <div><span className="font-medium text-zinc-900">Waktu ziarah: </span>{profile.visitorHours}</div>}
              {profile.dressCode && <div><span className="font-medium text-zinc-900">Kod pakaian: </span>{profile.dressCode}</div>}
              {profile.tourAvailable && profile.tourNote && <div><span className="font-medium text-zinc-900">Lawatan berpandu: </span>{profile.tourNote}</div>}
            </div>
            <div className="mt-3"><FreshnessStamp date={profile.updatedAt} /></div>
          </section>
        )}
        {profile.pantryAvailable && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CookingPot className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              <h2 className="text-xl font-bold text-emerald-950 tracking-tight">Pantri Komuniti</h2>
            </div>
            <div className="bg-white border border-zinc-200/70 rounded-xl p-5 space-y-2 text-sm text-zinc-700">
              {profile.pantryType && <div><span className="font-medium text-zinc-900">Jenis: </span>{PANTRY_TYPE_LABELS[profile.pantryType] ?? profile.pantryType}</div>}
              {profile.pantryHours && <div><span className="font-medium text-zinc-900">Waktu operasi: </span>{profile.pantryHours}</div>}
              {profile.pantryNote && <p className="text-zinc-600 leading-relaxed">{profile.pantryNote}</p>}
            </div>
            <div className="mt-3"><FreshnessStamp date={profile.updatedAt} /></div>
          </section>
        )}
      </div>
    </div>
  );
}