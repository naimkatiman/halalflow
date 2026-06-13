'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClockCounterClockwise, PaperPlaneTilt } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';

type DemoAction = 'day23' | 'day31' | 'day37' | 'reset' | 'sweep';

const TIME_ACTIONS: { action: DemoAction; label: string }[] = [
  { action: 'day23', label: 'Day 23 — reminder due' },
  { action: 'day31', label: 'Day 31 — trial expired' },
  { action: 'day37', label: 'Day 37 — win-back due' },
  { action: 'reset', label: 'Reset to fresh trial' },
];

export function DemoControls() {
  const router = useRouter();
  const [pending, setPending] = useState<DemoAction | null>(null);
  const [error, setError] = useState('');
  const [sweepResult, setSweepResult] = useState('');

  const run = async (action: DemoAction) => {
    setPending(action);
    setError('');
    setSweepResult('');
    try {
      const res = await fetchWithCsrf('/api/billing/demo-controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Demo action failed');
        return;
      }
      if (action === 'sweep') {
        const reminders = typeof data.reminders === 'number' ? data.reminders : 0;
        const winbacks = typeof data.winbacks === 'number' ? data.winbacks : 0;
        setSweepResult(
          `Sweep: ${reminders} ${reminders === 1 ? 'reminder' : 'reminders'}, ${winbacks} ${winbacks === 1 ? 'win-back' : 'win-backs'}`
        );
      }
      router.refresh();
    } catch (err) {
      console.error('DemoControls action error:', err);
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="bg-white border border-amber-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ClockCounterClockwise className="w-4 h-4 text-amber-600" weight="duotone" aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-zinc-950 text-sm">Demo time machine</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Simulates the passage of time for this workspace — demo only.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TIME_ACTIONS.map(({ action, label }) => (
          <button
            key={action}
            type="button"
            onClick={() => run(action)}
            disabled={pending !== null}
            className="text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors active:translate-y-px"
          >
            {pending === action ? 'Working…' : label}
          </button>
        ))}
      </div>

      <div className="pt-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={() => run('sweep')}
          disabled={pending !== null}
          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors active:translate-y-px"
        >
          <PaperPlaneTilt className="w-4 h-4" weight="bold" aria-hidden="true" />
          {pending === 'sweep' ? 'Sweeping…' : 'Run email sweep'}
        </button>
        {sweepResult && (
          <p className="text-sm text-zinc-600 mt-2" role="status">
            {sweepResult} —{' '}
            <Link href="/demo/outbox" className="text-emerald-700 hover:text-emerald-800 font-medium underline underline-offset-2">
              see Outbox
            </Link>
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}
