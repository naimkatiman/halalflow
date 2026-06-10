'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';

export function ApprovalActions({ workflowId, stepName }: { workflowId: string; stepName: string }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const act = async (action: 'approved' | 'rejected') => {
    setError('');
    setLoading(true);
    try {
      const res = await fetchWithCsrf(`/api/workflows/${workflowId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit decision');
        return;
      }
      setNote('');
      router.refresh();
    } catch (err) {
      console.error('ApprovalActions submit error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-3">
      <div>
        <p className="text-sm font-semibold text-zinc-950">Your action required</p>
        <p className="text-xs text-zinc-500 mt-0.5">Current step: <span className="font-medium text-zinc-700">{stepName}</span></p>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Add a note (optional)…"
        aria-label="Approval note"
        maxLength={1000}
        className="w-full px-3 py-2 border border-blue-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors resize-none"
      />
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => act('approved')}
          disabled={loading}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <CheckCircle className="w-4 h-4" weight="bold" aria-hidden="true" />
          Approve
        </button>
        <button
          type="button"
          onClick={() => act('rejected')}
          disabled={loading}
          className="flex items-center gap-1.5 border border-red-200 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <XCircle className="w-4 h-4" weight="bold" aria-hidden="true" />
          Reject
        </button>
      </div>
    </div>
  );
}
