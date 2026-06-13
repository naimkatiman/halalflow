'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';

interface DeleteButtonProps {
  endpoint: string;
  redirectTo: string;
  confirmMessage: string;
  label?: string;
}

export function DeleteButton({ endpoint, redirectTo, confirmMessage, label = 'Delete' }: DeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetchWithCsrf(endpoint, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === 'string' ? data.error : 'Delete failed. Try again.');
        setConfirming(false);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      console.error('DeleteButton error:', err);
      setError('Delete failed. Check your connection and try again.');
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {confirming ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-red-700 font-medium">{confirmMessage}</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium text-sm px-3 py-2 rounded-lg transition-colors"
          >
            <Trash className="w-3.5 h-3.5" aria-hidden="true" />
            {loading ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors px-1"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1.5 border border-zinc-200 hover:border-red-200 hover:bg-red-50 text-zinc-600 hover:text-red-600 font-medium text-sm px-3 py-2 rounded-lg transition-colors"
        >
          <Trash className="w-3.5 h-3.5" aria-hidden="true" />
          {label}
        </button>
      )}
      {error && (
        <p
          className="absolute right-0 top-full mt-2 w-72 z-10 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 shadow-sm"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
