'use client';

import { useState } from 'react';
import { CreditCard } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';

export function SubscribeButton({ label = 'Subscribe' }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const start = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithCsrf('/api/billing/checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(typeof data.error === 'string' ? data.error : 'Could not start checkout');
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors active:translate-y-px"
      >
        <CreditCard className="w-4 h-4" weight="bold" aria-hidden="true" />
        {loading ? 'Redirecting…' : label}
      </button>
      {error && <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>}
    </div>
  );
}
