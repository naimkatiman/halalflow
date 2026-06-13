'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf-client';

export function LogoutHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchWithCsrf('/api/auth/logout', { method: 'POST' })
      .catch((err) => { console.error('Logout request failed:', err); })
      .finally(() => {
        // Same-site only: "//host" or "https://…" would be an open redirect that
        // drops the just-logged-out user on an attacker page (LoginForm guards
        // its redirect param the same way).
        const redirectParam = searchParams.get('redirect');
        const safeRedirect =
          redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
            ? redirectParam
            : '/login';
        router.replace(safeRedirect);
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="text-center">
        <p className="text-sm text-zinc-500">Signing out…</p>
      </div>
    </div>
  );
}
