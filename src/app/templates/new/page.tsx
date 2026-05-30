import type { Metadata } from 'next';
import { NewTemplateForm } from './NewTemplateForm';

export const metadata: Metadata = {
  title: 'New Template — HalalFlow',
  description:
    'Create a reusable workflow template with ordered approval steps for your HalalFlow organization.',
};

export default function NewTemplatePage() {
  return <NewTemplateForm />;
}
