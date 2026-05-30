import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign in — HalalFlow',
  description:
    'Sign in to your HalalFlow account to manage Islamic finance workflows and approvals.',
};

export default function LoginPage() {
  return <LoginForm />;
}
