import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'HalalFlow — Islamic Finance Workflow Engine',
  description:
    'Open-source workflow engine for Islamic finance operators, mosques, zakat organizations, and Muslim SMEs. Manage structured approval workflows with transparency and accountability.',
};

export default async function RootPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (session.isLoggedIn) redirect('/dashboard');
  return <LandingPage />;
}
