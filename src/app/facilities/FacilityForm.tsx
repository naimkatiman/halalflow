'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';
import { FACILITY_TYPES, FACILITY_TYPE_LABELS } from '@/lib/bookings';
import { parseRmToSen, formatMYR } from '@/lib/money';

const BUNDLED_PHOTOS: { value: string; label: string }[] = [
  { value: '/images/mosque-hero.jpg', label: 'Gambar utama masjid' },
  { value: '/images/mosque-exterior-1.jpg', label: 'Eksterior masjid 1' },
  { value: '/images/mosque-exterior-2.jpg', label: 'Eksterior masjid 2' },
  { value: '/images/mosque-interior-1.jpg', label: 'Interior masjid 1' },
  { value: '/images/mosque-interior-2.jpg', label: 'Interior masjid 2' },
  { value: '/images/mosque-hall.jpg', label: 'Dewan masjid' },
  { value: '/images/mosque-community.jpg', label: 'Komuniti masjid' },
  { value: '/images/mosque-study.jpg', label: 'Ruang belajar' },
];

interface FacilityInitial {
  id: string;
  name: string;
  type: string;
  capacity: number;
  description?: string | null;
  photoUrl?: string | null;
  rateKariah: number;
  rateAwam: number;
  deposit: number;
  rateNote?: string | null;
  rules?: string | null;
  active: boolean;
}

interface FacilityFormProps {
  initial?: FacilityInitial;
}

function rmStr(sen: number): string {
  return (sen / 100).toFixed(2);
}

function isBundled(url: string | null | undefined): boolean {
  return BUNDLED_PHOTOS.some((p) => p.value === url);
}

export function FacilityForm({ initial }: FacilityFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? FACILITY_TYPES[0]);
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? '0'));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [photoSelect, setPhotoSelect] = useState(
    isBundled(initial?.photoUrl) ? (initial?.photoUrl ?? '') : ''
  );
  const [photoUrl, setPhotoUrl] = useState(
    !isBundled(initial?.photoUrl) ? (initial?.photoUrl ?? '') : ''
  );
  const [rateKariah, setRateKariah] = useState(initial ? rmStr(initial.rateKariah) : '');
  const [rateAwam, setRateAwam] = useState(initial ? rmStr(initial.rateAwam) : '');
  const [deposit, setDeposit] = useState(initial ? rmStr(initial.deposit) : '0');
  const [rateNote, setRateNote] = useState(initial?.rateNote ?? '');
  const [rules, setRules] = useState(initial?.rules ?? '');
  const [active, setActive] = useState(initial?.active ?? true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const effectivePhoto = photoUrl.trim() || photoSelect || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const kariahSen = parseRmToSen(rateKariah);
    if (kariahSen === null) { setError('Kadar kariah tidak sah'); return; }
    const awamSen = parseRmToSen(rateAwam);
    if (awamSen === null) { setError('Kadar awam tidak sah'); return; }
    const depositSen = parseRmToSen(deposit);
    if (depositSen === null) { setError('Deposit tidak sah'); return; }

    if (photoUrl.trim() && !/^https:\/\//.test(photoUrl.trim())) {
      setError('URL foto mesti bermula dengan https://');
      return;
    }

    const body: Record<string, unknown> = {
      name: name.trim(),
      type,
      capacity: Number(capacity) || 0,
      description: description.trim() || undefined,
      photoUrl: effectivePhoto,
      rateKariah: kariahSen,
      rateAwam: awamSen,
      deposit: depositSen,
      rateNote: rateNote.trim() || undefined,
      rules: rules.trim() || undefined,
      active,
    };

    setLoading(true);
    try {
      const url = isEdit ? `/api/facilities/${initial!.id}` : '/api/facilities';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetchWithCsrf(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan kemudahan');
        return;
      }
      router.push('/facilities');
      router.refresh();
    } catch {
      setError('Ralat rangkaian — cuba semula');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/facilities" aria-label="Kembali" className="text-zinc-400 hover:text-zinc-700 transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
        <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">
          {isEdit ? 'Edit Kemudahan' : 'Kemudahan Baharu'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-zinc-200/70 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-950 text-sm">Maklumat asas</h2>

          <div>
            <label htmlFor="fac-name" className="block text-sm font-medium text-zinc-700 mb-1.5">Nama kemudahan</label>
            <input
              id="fac-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              placeholder="cth. Dewan Serbaguna"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fac-type" className="block text-sm font-medium text-zinc-700 mb-1.5">Jenis</label>
              <select
                id="fac-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-white"
              >
                {FACILITY_TYPES.map((t) => (
                  <option key={t} value={t}>{FACILITY_TYPE_LABELS[t] ?? t}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fac-capacity" className="block text-sm font-medium text-zinc-700 mb-1.5">Kapasiti (orang)</label>
              <input
                id="fac-capacity"
                type="number"
                min={0}
                max={100000}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="fac-description" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Keterangan <span className="text-zinc-400 font-normal">(pilihan)</span>
            </label>
            <textarea
              id="fac-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
              placeholder="Huraikan kemudahan ini…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Foto</label>
            <select
              value={photoSelect}
              onChange={(e) => setPhotoSelect(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-white mb-2"
              aria-label="Pilih foto"
            >
              <option value="">Tiada foto</option>
              {BUNDLED_PHOTOS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Atau masukkan URL https:// (mengatasi pilihan di atas)"
              maxLength={500}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              aria-label="URL foto tersuai"
            />
            {effectivePhoto && (
              <p className="text-xs text-zinc-400 mt-1 truncate">Foto: {effectivePhoto}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              id="fac-active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="fac-active" className="text-sm font-medium text-zinc-700">
              Kemudahan aktif (boleh ditempah)
            </label>
          </div>
        </div>

        <div className="bg-white border border-zinc-200/70 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-950 text-sm">Kadar sewaan</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="fac-kariah" className="block text-sm font-medium text-zinc-700 mb-1.5">Kariah (RM)</label>
              <input
                id="fac-kariah"
                type="number"
                min={0}
                step={0.01}
                value={rateKariah}
                onChange={(e) => setRateKariah(e.target.value)}
                required
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="fac-awam" className="block text-sm font-medium text-zinc-700 mb-1.5">Awam (RM)</label>
              <input
                id="fac-awam"
                type="number"
                min={0}
                step={0.01}
                value={rateAwam}
                onChange={(e) => setRateAwam(e.target.value)}
                required
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="fac-deposit" className="block text-sm font-medium text-zinc-700 mb-1.5">Deposit (RM)</label>
              <input
                id="fac-deposit"
                type="number"
                min={0}
                step={0.01}
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                required
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="fac-ratenote" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Nota kadar <span className="text-zinc-400 font-normal">(cth. sehari, sesi 4 jam)</span>
            </label>
            <input
              id="fac-ratenote"
              type="text"
              value={rateNote}
              onChange={(e) => setRateNote(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              placeholder="sehari"
            />
          </div>

          <div>
            <label htmlFor="fac-rules" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Syarat penggunaan <span className="text-zinc-400 font-normal">(pilihan)</span>
            </label>
            <textarea
              id="fac-rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={3}
              maxLength={4000}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
              placeholder="Peraturan yang mesti dipatuhi…"
            />
          </div>

          {(rateKariah || rateAwam) && (
            <div className="text-xs text-zinc-400 bg-zinc-50 rounded-lg px-3 py-2 space-y-0.5">
              {rateKariah && parseRmToSen(rateKariah) !== null && (
                <p>Kariah: {formatMYR(parseRmToSen(rateKariah)!)}</p>
              )}
              {rateAwam && parseRmToSen(rateAwam) !== null && (
                <p>Awam: {formatMYR(parseRmToSen(rateAwam)!)}</p>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Cipta kemudahan'}
          </button>
          <Link href="/facilities" className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
