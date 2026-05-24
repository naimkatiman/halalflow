import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign in — HalalFlow',
};

export default function LoginPage() {
  return <LoginForm />;
}
