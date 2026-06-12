'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf-client';
import { FUNDS, FUND_LABELS } from '@/lib/ledger';
import { parseRmToSen } from '@/lib/money';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ManualEntryForm() {
  const router = useRouter();
  const [fund, setFund] = useState<string>(FUNDS[0]);
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [amountRm, setAmountRm] = useState('');
  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState(todayIso());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseRmToSen(amountRm);
    if (amount === null || amount <= 0) {
      setError('Masukkan jumlah yang sah');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithCsrf('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fund, direction, amount, description: description.trim(), entryDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menambah catatan');
        return;
      }
      setAmountRm('');
      setDescription('');
      setEntryDate(todayIso());
      router.refresh();
    } catch {
      setError('Ralat rangkaian — cuba semula');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200/70 rounded-xl p-6">
      <h2 className="font-semibold text-zinc-950 text-sm mb-4">Catatan manual</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="me-fund" className="block text-xs font-medium text-zinc-700 mb-1.5">Tabung</label>
            <select
              id="me-fund"
              value={fund}
              onChange={(e) => setFund(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            >
              {FUNDS.map((f) => (
                <option key={f} value={f}>{FUND_LABELS[f] ?? f}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="me-direction" className="block text-xs font-medium text-zinc-700 mb-1.5">Arah</label>
            <select
              id="me-direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'in' | 'out')}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            >
              <option value="in">Masuk</option>
              <option value="out">Keluar</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="me-amount" className="block text-xs font-medium text-zinc-700 mb-1.5">Jumlah (RM)</label>
            <input
              id="me-amount"
              type="number"
              min={0}
              step={0.01}
              value={amountRm}
              onChange={(e) => setAmountRm(e.target.value)}
              required
              placeholder="0.00"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="me-date" className="block text-xs font-medium text-zinc-700 mb-1.5">Tarikh</label>
            <input
              id="me-date"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="me-desc" className="block text-xs font-medium text-zinc-700 mb-1.5">Keterangan</label>
          <input
            id="me-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={300}
            placeholder="cth. Sumbangan kutipan Jumaat"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Menyimpan…' : 'Tambah catatan'}
        </button>
      </form>
    </div>
  );
}
