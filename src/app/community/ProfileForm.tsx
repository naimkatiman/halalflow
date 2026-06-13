'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/csrf-client';
import { MALAYSIAN_STATES } from '@/lib/states';

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

function isBundled(url: string | null | undefined): boolean {
  return BUNDLED_PHOTOS.some((p) => p.value === url);
}

interface ProfileInitial {
  displayName: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state: string;
  phone?: string | null;
  whatsapp?: string | null;
  photoUrl?: string | null;
  visitorsWelcome: boolean;
  visitorHours?: string | null;
  dressCode?: string | null;
  tourAvailable: boolean;
  tourNote?: string | null;
  pantryAvailable: boolean;
  pantryType?: string | null;
  pantryHours?: string | null;
  pantryNote?: string | null;
  published: boolean;
}

interface ProfileFormProps {
  initial: ProfileInitial | null;
  slug: string;
}

export function ProfileForm({ initial, slug }: ProfileFormProps) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(initial?.displayName ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [state, setState] = useState(initial?.state ?? MALAYSIAN_STATES[0]);
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? '');
  const [photoSelect, setPhotoSelect] = useState(
    isBundled(initial?.photoUrl) ? (initial?.photoUrl ?? '') : ''
  );
  const [photoUrl, setPhotoUrl] = useState(
    !isBundled(initial?.photoUrl) ? (initial?.photoUrl ?? '') : ''
  );
  const [published, setPublished] = useState(initial?.published ?? false);
  // Tracks the saved published state so "Lihat halaman awam" only shows after a successful save
  const [savedPublished, setSavedPublished] = useState(initial?.published ?? false);

  const [visitorsWelcome, setVisitorsWelcome] = useState(initial?.visitorsWelcome ?? false);
  const [visitorHours, setVisitorHours] = useState(initial?.visitorHours ?? '');
  const [dressCode, setDressCode] = useState(initial?.dressCode ?? '');
  const [tourAvailable, setTourAvailable] = useState(initial?.tourAvailable ?? false);
  const [tourNote, setTourNote] = useState(initial?.tourNote ?? '');

  const [pantryAvailable, setPantryAvailable] = useState(initial?.pantryAvailable ?? false);
  const [pantryType, setPantryType] = useState(initial?.pantryType ?? 'open');
  const [pantryHours, setPantryHours] = useState(initial?.pantryHours ?? '');
  const [pantryNote, setPantryNote] = useState(initial?.pantryNote ?? '');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const effectivePhoto = photoUrl.trim() || photoSelect || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (photoUrl.trim() && !/^https:\/\//.test(photoUrl.trim())) {
      setError('URL foto mesti bermula dengan https://');
      return;
    }

    const body = {
      displayName: displayName.trim(),
      description: description.trim(),
      address: address.trim(),
      city: city.trim(),
      state,
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      photoUrl: effectivePhoto ?? '',
      visitorsWelcome,
      visitorHours: visitorsWelcome ? visitorHours.trim() : '',
      dressCode: visitorsWelcome ? dressCode.trim() : '',
      tourAvailable: visitorsWelcome ? tourAvailable : false,
      tourNote: visitorsWelcome && tourAvailable ? tourNote.trim() : '',
      pantryAvailable,
      pantryType: pantryAvailable ? pantryType : undefined,
      pantryHours: pantryAvailable ? pantryHours.trim() : '',
      pantryNote: pantryAvailable ? pantryNote.trim() : '',
      published,
    };

    setLoading(true);
    try {
      const res = await fetchWithCsrf('/api/community/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan profil');
        return;
      }
      setSavedPublished(published);
      setSuccess(true);
      router.refresh();
    } catch {
      setError('Ralat rangkaian — cuba semula');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors';

  return (
    <div className="bg-white border border-zinc-200/70 rounded-xl">
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-semibold text-zinc-950">Profil komuniti</h2>
          {savedPublished && (
            <Link
              href={`/masjid/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              Lihat halaman awam →
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            id="prof-published"
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="prof-published" className="text-sm font-medium text-zinc-700">
            Diterbitkan
          </label>
        </div>
      </div>
      {savedPublished && (
        <p className="text-xs text-zinc-400 px-6 pt-3">
          Paparan awam di /masjid/{slug}
        </p>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Maklumat asas */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Maklumat asas</h3>

          <div>
            <label htmlFor="prof-name" className="block text-sm font-medium text-zinc-700 mb-1.5">Nama masjid / surau</label>
            <input id="prof-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={160} className={inputCls} placeholder="Masjid Al-Noor" />
          </div>

          <div>
            <label htmlFor="prof-desc" className="block text-sm font-medium text-zinc-700 mb-1.5">Keterangan</label>
            <textarea id="prof-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} className={`${inputCls} resize-none`} placeholder="Ceritakan tentang masjid anda…" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-address" className="block text-sm font-medium text-zinc-700 mb-1.5">Alamat</label>
              <input id="prof-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} className={inputCls} placeholder="No 1, Jalan Masjid" />
            </div>
            <div>
              <label htmlFor="prof-city" className="block text-sm font-medium text-zinc-700 mb-1.5">Bandar</label>
              <input id="prof-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} className={inputCls} placeholder="Shah Alam" />
            </div>
          </div>

          <div>
            <label htmlFor="prof-state" className="block text-sm font-medium text-zinc-700 mb-1.5">Negeri</label>
            <select id="prof-state" value={state} onChange={(e) => setState(e.target.value)} required className={`${inputCls} bg-white`}>
              {MALAYSIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-phone" className="block text-sm font-medium text-zinc-700 mb-1.5">Telefon</label>
              <input id="prof-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} className={inputCls} placeholder="+60 3-XXXX XXXX" />
            </div>
            <div>
              <label htmlFor="prof-wa" className="block text-sm font-medium text-zinc-700 mb-1.5">WhatsApp</label>
              <input id="prof-wa" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={30} className={inputCls} placeholder="+60 12-XXXX XXXX" />
            </div>
          </div>

          <div>
            <label htmlFor="prof-photo-select" className="block text-sm font-medium text-zinc-700 mb-1.5">Foto</label>
            <select
              id="prof-photo-select"
              value={photoSelect}
              onChange={(e) => setPhotoSelect(e.target.value)}
              className={`${inputCls} bg-white mb-2`}
            >
              <option value="">Tiada foto</option>
              {BUNDLED_PHOTOS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <label htmlFor="prof-photo-url" className="sr-only">URL foto tersuai</label>
            <input
              id="prof-photo-url"
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Atau URL https:// (mengatasi pilihan di atas)"
              maxLength={500}
              className={inputCls}
            />
          </div>
        </div>

        {/* Ziarah */}
        <div className="space-y-4 border-t border-zinc-100 pt-5">
          <div className="flex items-center gap-3">
            <input id="prof-ziarah" type="checkbox" checked={visitorsWelcome} onChange={(e) => setVisitorsWelcome(e.target.checked)} className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500" />
            <label htmlFor="prof-ziarah" className="text-sm font-semibold text-zinc-700">Ziarah — alu-alukan pengunjung</label>
          </div>
          {visitorsWelcome && (
            <div className="pl-7 space-y-4">
              <div>
                <label htmlFor="prof-hours" className="block text-sm font-medium text-zinc-700 mb-1.5">Waktu lawatan</label>
                <input id="prof-hours" type="text" value={visitorHours} onChange={(e) => setVisitorHours(e.target.value)} maxLength={200} className={inputCls} placeholder="8:00 pagi – 10:00 malam" />
              </div>
              <div>
                <label htmlFor="prof-dress" className="block text-sm font-medium text-zinc-700 mb-1.5">Kod pakaian</label>
                <input id="prof-dress" type="text" value={dressCode} onChange={(e) => setDressCode(e.target.value)} maxLength={300} className={inputCls} placeholder="Pakaian menutup aurat" />
              </div>
              <div className="flex items-center gap-3">
                <input id="prof-tour" type="checkbox" checked={tourAvailable} onChange={(e) => setTourAvailable(e.target.checked)} className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500" />
                <label htmlFor="prof-tour" className="text-sm font-medium text-zinc-700">Lawatan berpandu tersedia</label>
              </div>
              {tourAvailable && (
                <div>
                  <label htmlFor="prof-tournote" className="block text-sm font-medium text-zinc-700 mb-1.5">Nota lawatan</label>
                  <input id="prof-tournote" type="text" value={tourNote} onChange={(e) => setTourNote(e.target.value)} maxLength={500} className={inputCls} placeholder="Hubungi kami untuk tempahan lawatan berpandu" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pantri */}
        <div className="space-y-4 border-t border-zinc-100 pt-5">
          <div className="flex items-center gap-3">
            <input id="prof-pantry" type="checkbox" checked={pantryAvailable} onChange={(e) => setPantryAvailable(e.target.checked)} className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500" />
            <label htmlFor="prof-pantry" className="text-sm font-semibold text-zinc-700">Pantri — perkhidmatan makanan</label>
          </div>
          {pantryAvailable && (
            <div className="pl-7 space-y-4">
              <div>
                <label htmlFor="prof-pantrytype" className="block text-sm font-medium text-zinc-700 mb-1.5">Jenis pantri</label>
                <select id="prof-pantrytype" value={pantryType} onChange={(e) => setPantryType(e.target.value)} className={`${inputCls} bg-white`}>
                  <option value="open">Terbuka kepada semua</option>
                  <option value="asnaf">Untuk asnaf berdaftar</option>
                </select>
              </div>
              <div>
                <label htmlFor="prof-pantryhours" className="block text-sm font-medium text-zinc-700 mb-1.5">Waktu operasi</label>
                <input id="prof-pantryhours" type="text" value={pantryHours} onChange={(e) => setPantryHours(e.target.value)} maxLength={200} className={inputCls} placeholder="7:00 pagi – 10:00 malam" />
              </div>
              <div>
                <label htmlFor="prof-pantrynote" className="block text-sm font-medium text-zinc-700 mb-1.5">Nota</label>
                <input id="prof-pantrynote" type="text" value={pantryNote} onChange={(e) => setPantryNote(e.target.value)} maxLength={500} className={inputCls} placeholder="Pembungkusan sendiri digalakkan" />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2" role="alert">{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2" role="status">Profil disimpan.</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Menyimpan…' : 'Simpan profil'}
        </button>
      </form>
    </div>
  );
}
