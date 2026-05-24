'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf-client';

export function LogoutHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchWithCsrf('/api/auth/logout', { method: 'POST' })
      .finally(() => {
        const redirect = searchParams.get('redirect') || '/login';
        router.replace(redirect);
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="text-center">
        <p className="text-sm text-zinc-500">Signing out...</p>
      </div>
    </div>
  );
}
