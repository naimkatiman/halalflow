import type { Metadata } from 'next';
import OnboardingForm from './OnboardingForm';

export const metadata: Metadata = {
  title: 'Create Workspace — MosRev',
  description:
    'Set up your organization workspace on MosRev to start managing structured approval workflows.',
};

export default function OnboardingPage() {
  return <OnboardingForm />;
}
