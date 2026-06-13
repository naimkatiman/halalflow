'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf-client';

/**
 * Switches the active org to `orgId` via the existing switch route handler
 * (the correct place to mutate the session cookie), then lands on the
 * dashboard. Rendered only after server-side membership has been confirmed.
 */
export function EnterWorkspace({ orgId, orgName }: { orgId: string; orgName: string }) {
  const router = useRouter();
  const [error, setError] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await fetchWithCsrf(`/api/orgs/${orgId}/switch`, { method: 'POST' });
        if (!res.ok) throw new Error('switch failed');
        router.replace('/dashboard');
        router.refresh();
      } catch {
        setError(true);
      }
    })();
  }, [orgId, router]);

  return (
    <div role="status" className="flex flex-col items-center justify-center py-24 text-center">
      {error ? (
        <p className="text-sm text-zinc-500">
          Could not open {orgName}. <a href="/dashboard" className="text-emerald-700 hover:text-emerald-800 font-medium">Go to dashboard</a>.
        </p>
      ) : (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <div className="w-4 h-4 border-2 border-zinc-200 border-t-emerald-600 rounded-full animate-spin" aria-hidden="true" />
          <span>Opening {orgName}…</span>
        </div>
      )}
    </div>
  );
}
