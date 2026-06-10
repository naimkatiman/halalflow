import type { Metadata } from 'next';
import { NewTemplateForm } from './NewTemplateForm';

export const metadata: Metadata = {
  title: 'New Template — MosRev',
  description:
    'Create a reusable workflow template with ordered approval steps for your MosRev organization.',
};

export default function NewTemplatePage() {
  return <NewTemplateForm />;
}
