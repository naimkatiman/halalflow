'use client';

import { useState } from 'react';
import { Buildings, CheckCircle } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';

interface Org {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export function OrgSwitcher({ orgs, currentOrgId }: { orgs: Org[]; currentOrgId: string }) {
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrgId) return;
    setSwitching(orgId);
    setError('');
    try {
      const res = await fetchWithCsrf(`/api/orgs/${orgId}/switch`, { method: 'POST' });
      if (res.ok) {
        // A workspace switch changes session-global state the client navbar
        // caches, so a full reload is intentional (router.refresh would leave
        // the navbar's org pill pointing at the previous workspace).
        window.location.reload();
        return;
      }
      const data = await res.json().catch(() => null);
      setError(typeof data?.error === 'string' ? data.error : 'Could not switch workspace. Try again.');
      setSwitching(null);
    } catch (err) {
      console.error('Org switch error:', err);
      setError('Could not reach the server. Check your connection and try again.');
      setSwitching(null);
    }
  };

  return (
    <div className="bg-white border border-zinc-200/70 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Buildings className="w-4 h-4 text-zinc-500" aria-hidden="true" />
        <h2 className="font-semibold text-zinc-950 text-sm">Your Organizations</h2>
      </div>
      <div className="divide-y divide-zinc-100">
        {orgs.map((org) => {
          const isCurrent = org.id === currentOrgId;
          return (
            <div key={org.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-zinc-950 truncate">{org.name}</div>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" weight="fill" aria-hidden="true" />
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500">{org.slug} · <span className="capitalize">{org.role}</span></div>
              </div>
              {!isCurrent && (
                <button
                  type="button"
                  onClick={() => handleSwitch(org.id)}
                  disabled={switching === org.id}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-50 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50"
                >
                  {switching === org.id ? 'Switching…' : 'Switch'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
