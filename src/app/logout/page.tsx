import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LogoutHandler } from './LogoutHandler';

export const metadata: Metadata = {
  title: 'Sign out — MosRev',
  description: 'You are being signed out of MosRev.',
};

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
