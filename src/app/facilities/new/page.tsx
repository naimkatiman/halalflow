import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SessionData, sessionOptions } from '@/lib/session';
import { requireActiveSubscription } from '@/lib/require-subscription';
import { FacilityForm } from '../FacilityForm';

export const metadata: Metadata = {
  title: 'Kemudahan Baharu — MosRev',
};

export default async function NewFacilityPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');
  await requireActiveSubscription(session.orgId);

  return <FacilityForm />;
}
