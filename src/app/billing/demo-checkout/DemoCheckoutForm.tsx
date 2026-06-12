'use client';

import { useState } from 'react';
import { CreditCard } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';

const inputCls =
  'w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors';

export function DemoCheckoutForm({ name }: { name: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Artificial pause so the simulated payment feels like a real processor.
      await new Promise((resolve) => setTimeout(resolve, 800));
      const res = await fetchWithCsrf('/api/billing/demo-checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Payment simulation failed');
        setLoading(false);
        return;
      }
      window.location.href = '/billing?status=success';
    } catch (err) {
      console.error('DemoCheckoutForm submit error:', err);
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-zinc-200/70 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-zinc-950 text-sm">Payment details</h2>

      <div className="space-y-1">
        <label htmlFor="demo-card-number" className="text-xs font-semibold text-zinc-700">Card number</label>
        <input id="demo-card-number" type="text" value="4242 4242 4242 4242" readOnly className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="demo-card-expiry" className="text-xs font-semibold text-zinc-700">Expiry</label>
          <input id="demo-card-expiry" type="text" value="12/34" readOnly className={inputCls} />
        </div>
        <div className="space-y-1">
          <label htmlFor="demo-card-cvc" className="text-xs font-semibold text-zinc-700">CVC</label>
          <input id="demo-card-cvc" type="text" value="123" readOnly className={inputCls} />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="demo-card-name" className="text-xs font-semibold text-zinc-700">Name on card</label>
        <input id="demo-card-name" type="text" value={name} readOnly className={inputCls} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors active:translate-y-px"
      >
        <CreditCard className="w-4 h-4" weight="bold" aria-hidden="true" />
        {loading ? 'Processing…' : 'Pay RM99.00'}
      </button>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </form>
  );
}
