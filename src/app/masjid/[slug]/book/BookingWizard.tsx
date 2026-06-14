"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight, ArrowLeft, UsersThree, WhatsappLogo } from "@phosphor-icons/react";
import { EVENT_TYPE_LABELS, FACILITY_TYPE_LABELS } from "@/lib/bookings";
import { formatMYR } from "@/lib/money";
import { estimateBooking } from "@/lib/booking-pricing";
import { timeRangesOverlap } from "@/lib/availability";

interface Facility {
  id: string;
  name: string;
  type: string;
  capacity: number;
  description: string | null;
  photoUrl: string | null;
  rateKariah: number;
  rateAwam: number;
  deposit: number;
  rateNote: string | null;
  rules: string | null;
}

interface Props {
  slug: string;
  facilities: Facility[];
  preselect?: string;
  whatsapp?: string | null;
}

interface Confirmation {
  reference: string;
  token: string;
}

interface Occupied {
  startTime: string;
  endTime: string;
}

const inputCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors";
const labelCls = "block text-xs font-medium text-zinc-700 mb-1";

const STEPS = ["Fasiliti", "Tarikh & Masa", "Maklumat", "Semak"];

export function BookingWizard({ slug, facilities, preselect, whatsapp }: Props) {
  // Computed after mount to avoid an SSR/client hydration mismatch on the date
  // input's min/max across a midnight or timezone boundary.
  const [dateBounds, setDateBounds] = useState({ today: "", maxDate: "" });
  useEffect(() => {
    setDateBounds({
      today: new Date().toISOString().slice(0, 10),
      maxDate: new Date(Date.now() + 730 * 86400000).toISOString().slice(0, 10),
    });
  }, []);

  const defaultFacility =
    preselect && facilities.some((f) => f.id === preselect) ? preselect : (facilities[0]?.id ?? "");

  const [step, setStep] = useState(1);
  const [facilityId, setFacilityId] = useState(defaultFacility);
  const [eventType, setEventType] = useState("kenduri");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [pax, setPax] = useState("1");
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [isKariah, setIsKariah] = useState(false);
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [occupied, setOccupied] = useState<Occupied[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const selectedFacility = facilities.find((f) => f.id === facilityId);

  // Fetch occupied slots whenever the facility/date pair changes on step 2.
  useEffect(() => {
    if (step !== 2 || !facilityId || !eventDate) {
      setOccupied([]);
      return;
    }
    let active = true;
    fetch(`/api/public/bookings/availability?slug=${encodeURIComponent(slug)}&facilityId=${encodeURIComponent(facilityId)}&date=${eventDate}`)
      .then((r) => (r.ok ? r.json() : { data: { occupied: [] } }))
      .then((d) => {
        if (active) setOccupied((d?.data?.occupied as Occupied[]) ?? []);
      })
      .catch(() => {
        if (active) setOccupied([]);
      });
    return () => {
      active = false;
    };
  }, [step, facilityId, eventDate, slug]);

  const paxNum = parseInt(pax, 10);
  const overCapacity =
    !!selectedFacility && selectedFacility.capacity > 0 && Number.isFinite(paxNum) && paxNum > selectedFacility.capacity;
  const timeValid = !!startTime && !!endTime && endTime > startTime;
  const clashes = timeValid && occupied.some((o) => timeRangesOverlap(startTime, endTime, o.startTime, o.endTime));

  const step2Valid = !!eventDate && timeValid && Number.isFinite(paxNum) && paxNum >= 1 && !overCapacity;
  const step3Valid = applicantName.trim().length > 0 && applicantPhone.trim().length >= 6;

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          facilityId,
          eventType,
          eventDate,
          startTime,
          endTime,
          pax: paxNum,
          applicantName,
          applicantPhone,
          applicantEmail: applicantEmail || undefined,
          isKariah,
          notes: notes || undefined,
          website: website || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.status === 201) {
        const d = data.data as Record<string, unknown>;
        setConfirmation({
          reference: typeof d?.reference === "string" ? d.reference : "?",
          token: typeof d?.token === "string" ? d.token : "",
        });
        return;
      }
      if (res.status === 429) {
        setError("Terlalu banyak permohonan. Cuba sebentar lagi.");
        return;
      }
      if (res.status === 404) {
        setError("Masjid atau kemudahan tidak dijumpai.");
        return;
      }
      setError(typeof data?.error === "string" ? data.error : "Ralat tidak dijangka. Sila cuba lagi.");
    } catch {
      setError("Ralat sambungan. Sila semak internet dan cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // ── Confirmation ──────────────────────────────────────────────────────────
  if (confirmation) {
    const waDigits = (whatsapp ?? "").replace(/\D/g, "");
    const waText = encodeURIComponent(
      `Salam, saya telah membuat tempahan (Ruj: ${confirmation.reference}) untuk ${selectedFacility?.name ?? "fasiliti"} pada ${eventDate}.`,
    );
    return (
      <div className="bg-white border border-zinc-200/70 rounded-xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" weight="duotone" aria-hidden="true" />
        <h2 className="text-lg font-bold text-zinc-950 mb-1">Permohonan diterima</h2>
        <p className="text-sm text-zinc-500 mb-1">
          Nombor rujukan: <span className="font-semibold text-zinc-900 font-mono">{confirmation.reference}</span>
        </p>
        <p className="text-sm text-zinc-600 mb-5">
          Pejabat masjid akan menyemak dan menghantar sebutharga. Simpan pautan ini untuk menyemak status dan membuat bayaran.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {confirmation.token && (
            <Link
              href={`/masjid/${slug}/tempah/${confirmation.token}`}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors tap"
            >
              Semak Status &amp; Bayar
              <ArrowRight className="w-4 h-4" weight="bold" aria-hidden="true" />
            </Link>
          )}
          {waDigits && (
            <a
              href={`https://wa.me/${waDigits}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              <WhatsappLogo className="w-4 h-4" aria-hidden="true" />
              WhatsApp Pejabat
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── Wizard ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Progress */}
      <ol className="flex items-center gap-2 text-xs font-medium">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                aria-current={active ? "step" : undefined}
                className={
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full border " +
                  (active
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : done
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-white text-zinc-400 border-zinc-200")
                }
              >
                {n}. {label}
              </span>
              {n < STEPS.length && <span className="text-zinc-300">›</span>}
            </li>
          );
        })}
      </ol>

      {/* Step 1 — Fasiliti */}
      {step === 1 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {facilities.map((f) => {
            const selected = f.id === facilityId;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFacilityId(f.id);
                  setStep(2);
                }}
                className={
                  "text-left bg-white border rounded-xl overflow-hidden transition-colors tap " +
                  (selected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-zinc-200/70 hover:border-emerald-300")
                }
              >
                <div className="h-32 overflow-hidden bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.photoUrl ?? "/images/mosque-hall.jpg"} alt={`Foto ${f.name}`} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-zinc-950 text-sm">{f.name}</h3>
                    <span className="inline-flex items-center text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 shrink-0">
                      {FACILITY_TYPE_LABELS[f.type] ?? f.type}
                    </span>
                  </div>
                  {f.capacity > 0 && (
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mb-2">
                      <UsersThree className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Kapasiti {f.capacity} pax</span>
                    </div>
                  )}
                  <div className="space-y-0.5 text-xs text-zinc-700">
                    {f.rateKariah > 0 && <div>Ahli kariah <span className="font-semibold">{formatMYR(f.rateKariah)}</span></div>}
                    {f.rateAwam > 0 && <div>Awam <span className="font-semibold">{formatMYR(f.rateAwam)}</span></div>}
                    {f.deposit > 0 && <div>Deposit <span className="font-semibold">{formatMYR(f.deposit)}</span></div>}
                    {f.rateNote && <div className="text-zinc-400">{f.rateNote}</div>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2 — Tarikh & Masa */}
      {step === 2 && (
        <div className="bg-white border border-zinc-200/70 rounded-xl p-6 space-y-5">
          {selectedFacility?.rules && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-4 leading-relaxed">
              <span className="font-semibold block mb-1">Peraturan kemudahan:</span>
              {selectedFacility.rules}
            </div>
          )}
          <div>
            <label htmlFor="eventDate" className={labelCls}>Tarikh acara</label>
            <input id="eventDate" type="date" value={eventDate} min={dateBounds.today} max={dateBounds.maxDate} onChange={(e) => setEventDate(e.target.value)} className={inputCls} required />
          </div>
          {eventDate && occupied.length > 0 && (
            <div className="text-xs text-zinc-500">
              <span className="font-medium text-zinc-600">Telah ditempah pada tarikh ini: </span>
              <span className="inline-flex flex-wrap gap-1.5 mt-1">
                {occupied.map((o) => (
                  <span key={`${o.startTime}-${o.endTime}`} className="inline-flex items-center bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5">
                    {o.startTime}–{o.endTime}
                  </span>
                ))}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className={labelCls}>Masa mula</label>
              <input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label htmlFor="endTime" className={labelCls}>Masa tamat</label>
              <input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} required />
            </div>
          </div>
          {!!startTime && !!endTime && !timeValid && (
            <p className="text-xs text-danger" role="status">Masa tamat mesti selepas masa mula.</p>
          )}
          {clashes && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" role="status">
              Masa ini bertindih dengan tempahan sedia ada. Anda masih boleh memohon — pejabat akan mengesahkan ketersediaan.
            </p>
          )}
          <div>
            <label htmlFor="pax" className={labelCls}>
              Anggaran bilangan tetamu (pax){selectedFacility && selectedFacility.capacity > 0 ? ` · maks ${selectedFacility.capacity}` : ""}
            </label>
            <input id="pax" type="number" min="1" max={selectedFacility && selectedFacility.capacity > 0 ? selectedFacility.capacity : 100000} value={pax} onChange={(e) => setPax(e.target.value)} className={inputCls} required />
            {overCapacity && <p className="mt-1 text-xs text-danger" role="status">Melebihi kapasiti kemudahan ({selectedFacility?.capacity} pax).</p>}
          </div>
        </div>
      )}

      {/* Step 3 — Maklumat */}
      {step === 3 && (
        <div className="bg-white border border-zinc-200/70 rounded-xl p-6 space-y-5">
          <div>
            <label htmlFor="eventType" className={labelCls}>Jenis acara</label>
            <select id="eventType" value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputCls} required>
              {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="applicantName" className={labelCls}>Nama pemohon</label>
            <input id="applicantName" type="text" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} className={inputCls} placeholder="Nama penuh" required maxLength={160} />
          </div>
          <div>
            <label htmlFor="applicantPhone" className={labelCls}>No. telefon</label>
            <input id="applicantPhone" type="tel" value={applicantPhone} onChange={(e) => setApplicantPhone(e.target.value)} className={inputCls} placeholder="01x-xxxxxxx" required maxLength={30} />
          </div>
          <div>
            <label htmlFor="applicantEmail" className={labelCls}>E-mel (untuk pengesahan & status)</label>
            <input id="applicantEmail" type="email" value={applicantEmail} onChange={(e) => setApplicantEmail(e.target.value)} className={inputCls} placeholder="nama@contoh.com" maxLength={200} />
          </div>
          <div className="flex items-center gap-2">
            <input id="isKariah" type="checkbox" checked={isKariah} onChange={(e) => setIsKariah(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500" />
            <label htmlFor="isKariah" className="text-sm text-zinc-700">Saya ahli kariah masjid ini</label>
          </div>
          <div>
            <label htmlFor="notes" className={labelCls}>Catatan tambahan (pilihan)</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls + " resize-none"} rows={3} maxLength={2000} placeholder="Keperluan khas, pertanyaan, dsb." />
          </div>
          {/* Honeypot — hidden from humans */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 4 — Semak & Sahkan */}
      {step === 4 && selectedFacility && (
        <div className="bg-white border border-zinc-200/70 rounded-xl p-6 space-y-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt className="text-zinc-400 text-xs">Kemudahan</dt><dd className="font-medium text-zinc-900">{selectedFacility.name}</dd></div>
            <div><dt className="text-zinc-400 text-xs">Jenis acara</dt><dd className="font-medium text-zinc-900">{EVENT_TYPE_LABELS[eventType] ?? eventType}</dd></div>
            <div><dt className="text-zinc-400 text-xs">Tarikh</dt><dd className="font-medium text-zinc-900">{eventDate}</dd></div>
            <div><dt className="text-zinc-400 text-xs">Masa</dt><dd className="font-medium text-zinc-900">{startTime} – {endTime}</dd></div>
            <div><dt className="text-zinc-400 text-xs">Pax</dt><dd className="font-medium text-zinc-900">{paxNum}</dd></div>
            <div><dt className="text-zinc-400 text-xs">Pemohon</dt><dd className="font-medium text-zinc-900">{applicantName}</dd></div>
          </dl>
          {(() => {
            const est = estimateBooking(selectedFacility, isKariah);
            return (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-sm">
                <div className="flex justify-between"><span className="text-zinc-600">Kadar {isKariah && selectedFacility.rateKariah > 0 ? "ahli kariah" : "awam"}</span><span className="font-semibold text-zinc-900">{formatMYR(est.rate)}</span></div>
                {est.deposit > 0 && <div className="flex justify-between"><span className="text-zinc-600">Deposit</span><span className="font-semibold text-zinc-900">{formatMYR(est.deposit)}</span></div>}
                <div className="flex justify-between border-t border-emerald-200 mt-2 pt-2"><span className="text-zinc-700 font-medium">Anggaran</span><span className="font-bold text-emerald-800">{formatMYR(est.total)}</span></div>
                <p className="text-xs text-zinc-500 mt-2">Anggaran sahaja — pejabat masjid akan sahkan sebutharga muktamad.</p>
              </div>
            );
          })()}
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        {step > 1 ? (
          <button type="button" onClick={() => { setError(""); setStep(step - 1); }} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Kembali
          </button>
        ) : <span />}

        {step === 1 && (
          <button type="button" onClick={() => setStep(2)} disabled={!facilityId} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors tap">
            Seterusnya <ArrowRight className="w-4 h-4" weight="bold" aria-hidden="true" />
          </button>
        )}
        {step === 2 && (
          <button type="button" onClick={() => setStep(3)} disabled={!step2Valid} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors tap">
            Seterusnya <ArrowRight className="w-4 h-4" weight="bold" aria-hidden="true" />
          </button>
        )}
        {step === 3 && (
          <button type="button" onClick={() => setStep(4)} disabled={!step3Valid} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors tap">
            Semak <ArrowRight className="w-4 h-4" weight="bold" aria-hidden="true" />
          </button>
        )}
        {step === 4 && (
          <button type="button" onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors tap">
            {loading ? "Menghantar…" : "Hantar Permohonan"}
          </button>
        )}
      </div>
    </div>
  );
}
