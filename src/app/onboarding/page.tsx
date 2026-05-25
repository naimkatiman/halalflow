import type { Metadata } from 'next';
import OnboardingForm from './OnboardingForm';

export const metadata: Metadata = {
  title: 'Create Workspace — HalalFlow',
};

export default function OnboardingPage() {
  return <OnboardingForm />;
}
