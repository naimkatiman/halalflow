import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterForm } from './RegisterForm';

export const metadata: Metadata = {
  title: 'Register — MosRev',
  description:
    'Create a MosRev account to start managing structured approval workflows for your organization.',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageSkeleton />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm animate-pulse dark:bg-zinc-900 dark:border-zinc-800">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded mb-4" />
          <div className="space-y-4">
            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
