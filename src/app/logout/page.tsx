'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LogoutHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch('/api/auth/logout', { method: 'POST' })
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

export default function LogoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="text-center">
          <p className="text-sm text-zinc-500">Signing out...</p>
        </div>
      </div>
    }>
      <LogoutHandler />
    </Suspense>
  );
}
