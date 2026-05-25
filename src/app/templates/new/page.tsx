import type { Metadata } from 'next';
import { NewTemplateForm } from './NewTemplateForm';

export const metadata: Metadata = {
  title: 'New Template — HalalFlow',
};

export default function NewTemplatePage() {
  return <NewTemplateForm />;
}
