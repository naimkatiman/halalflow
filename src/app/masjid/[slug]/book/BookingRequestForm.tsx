"use client";

import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { EVENT_TYPE_LABELS } from "@/lib/bookings";

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
}

interface Confirmation {
  reference: string;
}

export function BookingRequestForm({ slug, facilities, preselect }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 730 * 86400000).toISOString().slice(0, 10);

  const defaultFacility =
    preselect && facilities.some((f) => f.id === preselect)
      ? preselect
      : (facilities[0]?.id ?? "");

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const selectedFacility = facilities.find((f) => f.id === facilityId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          pax: parseInt(pax, 10),
          applicantName,
          applicantPhone,
          applicantEmail: applicantEmail || undefined,
          isKariah,
          notes: notes || undefined,
        }),
      });
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (res.status === 201) {
        const ref = (data.data as Record<string, unknown>)?.reference;
        setConfirmation({ reference: typeof ref === "string" ? ref : "?" });
        return;
      }
      if (res.status === 429) { setError("Terlalu banyak permohonan. Cuba sebentar lagi."); return; }
      if (res.status === 404) { setError("Masjid atau kemudahan tidak dijumpai."); return; }
      setError(typeof data?.error === "string" ? data.error : "Ralat tidak dijangka. Sila cuba lagi.");
    } catch {
      setError("Ralat sambungan. Sila semak internet dan cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (confirmation) {
    return (
      <div className="bg-white border border-zinc-200/70 rounded-xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" weight="duotone" aria-hidden="true" />
        <h2 className="text-lg font-bold text-zinc-950 mb-1">Permohonan diterima</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Nombor rujukan: <span className="font-semibold text-zinc-900 font-mono">{confirmation.reference}</span>
        </p>
        <p className="text-sm text-zinc-600">Pejabat masjid akan menghubungi anda untuk pengesahan dan bayaran.</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors";
  const labelCls = "block text-xs font-medium text-zinc-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="facilityId" className={labelCls}>Kemudahan</label>
        <select id="facilityId" value={facilityId} onChange={(e) => setFacilityId(e.target.value)} className={inputCls} required>
          {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
      {selectedFacility?.rules && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-4 leading-relaxed">
          <span className="font-semibold block mb-1">Peraturan kemudahan:</span>{selectedFacility.rules}
        </div>
      )}
      <div>
        <label htmlFor="eventType" className={labelCls}>Jenis acara</label>
        <select id="eventType" value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputCls} required>
          {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="eventDate" className={labelCls}>Tarikh acara</label>
        <input id="eventDate" type="date" value={eventDate} min={today} max={maxDate} onChange={(e) => setEventDate(e.target.value)} className={inputCls} required />
      </div>
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
      <div>
        <label htmlFor="pax" className={labelCls}>Anggaran bilangan tetamu (pax)</label>
        <input id="pax" type="number" min="1" max="100000" value={pax} onChange={(e) => setPax(e.target.value)} className={inputCls} required />
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
        <label htmlFor="applicantEmail" className={labelCls}>E-mel (pilihan)</label>
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
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
      <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors">
        {loading ? "Menghantar…" : "Hantar Permohonan"}
      </button>
    </form>
  );
}