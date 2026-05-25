import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NewWorkflowForm } from './NewWorkflowForm';

export const metadata: Metadata = {
  title: 'New Workflow — HalalFlow',
};

export default function NewWorkflowPage() {
  return (
    <Suspense fallback={null}>
      <NewWorkflowForm />
    </Suspense>
  );
}
