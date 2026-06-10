import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NewWorkflowForm } from './NewWorkflowForm';

export const metadata: Metadata = {
  title: 'New Workflow — MosRev',
  description:
    'Submit a new structured approval workflow from a template in your MosRev organization.',
};

export default function NewWorkflowPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl space-y-6" aria-busy="true">
          <div className="h-8 w-48 bg-zinc-100 rounded animate-pulse" />
          <div className="bg-white border border-zinc-200/70 rounded-xl p-6 space-y-4">
            <div className="h-9 bg-zinc-100 rounded-lg animate-pulse" />
            <div className="h-9 bg-zinc-100 rounded-lg animate-pulse" />
            <div className="h-9 w-2/3 bg-zinc-100 rounded-lg animate-pulse" />
          </div>
        </div>
      }
    >
      <NewWorkflowForm />
    </Suspense>
  );
}
