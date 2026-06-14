'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf-client';
import { parseRmToSen, formatMYR } from '@/lib/money';

interface Booking {
  id: string;
  status: string;
  quotedAmount?: number | null;
  depositAmount?: number | null;
}

interface BookingActionsProps {
  booking: Booking;
}

type Panel = 'approve' | 'decline' | 'payment' | null;

export function BookingActions({ booking }: BookingActionsProps) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Approve fields
  const [quoteRm, setQuoteRm] = useState('');
  const [depositRm, setDepositRm] = useState('');

  // Decline fields
  const [declineReason, setDeclineReason] = useState('');

  // Payment fields
  const [paymentRm, setPaymentRm] = useState(
    booking.quotedAmount ? (booking.quotedAmount / 100).toFixed(2) : ''
  );
  const [paymentNote, setPaymentNote] = useState('');

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetchWithCsrf(`/api/bookings/${booking.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setError('Tempahan telah dikemaskini oleh orang lain — muat semula.');
        router.refresh();
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Gagal melakukan tindakan');
        return;
      }
      setPanel(null);
      router.refresh();
    } catch {
      setError('Ralat rangkaian — cuba semula');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    const quotedAmount = parseRmToSen(quoteRm);
    if (quotedAmount === null || quotedAmount <= 0) {
      setError('Masukkan jumlah sebutharga yang sah');
      return;
    }
    const depositAmount = depositRm.trim() ? parseRmToSen(depositRm) : undefined;
    if (depositRm.trim() && depositAmount === null) {
      setError('Deposit tidak sah');
      return;
    }
    await act('approve', { quotedAmount, ...(depositAmount !== undefined ? { depositAmount } : {}) });
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      setError('Masukkan sebab penolakan');
      return;
    }
    await act('decline', { declineReason: declineReason.trim() });
  };

  const handlePayment = async () => {
    const paymentAmount = parseRmToSen(paymentRm);
    if (paymentAmount === null || paymentAmount <= 0) {
      setError('Masukkan jumlah bayaran yang sah');
      return;
    }
    await act('record_payment', {
      paymentAmount,
      ...(paymentNote.trim() ? { paymentNote: paymentNote.trim() } : {}),
    });
  };

  const handleCancel = () => {
    if (!window.confirm('Batal tempahan ini? Tindakan ini tidak boleh dibuat asal.')) return;
    act('cancel');
  };
  const handleComplete = () => act('complete');

  const s = booking.status;
  const isTerminal = s === 'completed' || s === 'declined' || s === 'cancelled';

  if (isTerminal) {
    const msg: Record<string, string> = {
      completed: 'Tempahan ini telah selesai.',
      declined: 'Tempahan ini telah ditolak.',
      cancelled: 'Tempahan ini telah dibatalkan.',
    };
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-4">
        <p className="text-sm text-zinc-500">{msg[s] ?? 'Tiada tindakan tersedia.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-danger bg-danger-tint border border-danger-line rounded-lg px-4 py-2" role="alert">
          {error}
        </p>
      )}

      {/* requested → Approve / Decline / Cancel */}
      {s === 'requested' && (
        <div className="bg-pending-tint border border-pending-line rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-zinc-950">Tindakan diperlukan</p>

          {panel === 'approve' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Sebutharga (RM)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={quoteRm}
                    onChange={(e) => setQuoteRm(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    aria-label="Sebutharga RM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Deposit (RM, pilihan)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={depositRm}
                    onChange={(e) => setDepositRm(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    aria-label="Deposit RM"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2 rounded-lg tap"
                >
                  {loading ? 'Memproses…' : 'Sahkan lulus'}
                </button>
                <button type="button" onClick={() => setPanel(null)} disabled={loading} className="text-sm text-zinc-500 hover:text-zinc-700">Batal</button>
              </div>
            </div>
          )}

          {panel === 'decline' && (
            <div className="space-y-3">
              <textarea
                rows={2}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Sebab penolakan…"
                maxLength={500}
                className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
                aria-label="Sebab penolakan"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={loading}
                  className="bg-danger hover:bg-danger-strong disabled:opacity-50 text-white font-semibold text-sm px-4 py-2 rounded-lg tap"
                >
                  {loading ? 'Memproses…' : 'Tolak tempahan'}
                </button>
                <button type="button" onClick={() => setPanel(null)} disabled={loading} className="text-sm text-zinc-500 hover:text-zinc-700">Batal</button>
              </div>
            </div>
          )}

          {panel === null && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPanel('approve')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-lg tap"
              >
                Lulus
              </button>
              <button
                type="button"
                onClick={() => setPanel('decline')}
                className="border border-danger-line hover:bg-danger-tint text-danger font-semibold text-sm px-4 py-2 rounded-lg tap"
              >
                Tolak
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Memproses…' : 'Batal tempahan'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* approved → Record payment / Cancel */}
      {s === 'approved' && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-zinc-950">
            Menunggu pembayaran
            {booking.quotedAmount ? ` · ${formatMYR(booking.quotedAmount)}` : ''}
          </p>

          {panel === 'payment' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Jumlah bayaran (RM)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={paymentRm}
                    onChange={(e) => setPaymentRm(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    aria-label="Jumlah bayaran RM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Nota (pilihan)</label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="cth. Tunai, Transfer"
                    maxLength={500}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    aria-label="Nota bayaran"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2 rounded-lg tap"
                >
                  {loading ? 'Memproses…' : 'Rekod bayaran'}
                </button>
                <button type="button" onClick={() => setPanel(null)} disabled={loading} className="text-sm text-zinc-500 hover:text-zinc-700">Batal</button>
              </div>
            </div>
          )}

          {panel === null && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPanel('payment')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-lg tap"
              >
                Rekod pembayaran
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Memproses…' : 'Batal tempahan'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* paid → Mark completed */}
      {s === 'paid' && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-zinc-950">Bayaran diterima</p>
          <button
            type="button"
            onClick={handleComplete}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Memproses…' : 'Tandakan selesai'}
          </button>
        </div>
      )}
    </div>
  );
}
