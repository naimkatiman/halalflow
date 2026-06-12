import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SessionData, sessionOptions } from '@/lib/session';
import { withOrg } from '@/lib/db';
import { prismaAdmin } from '@/lib/db';
import { requireActiveSubscription } from '@/lib/require-subscription';
import { ProfileForm } from './ProfileForm';
import { RamadanManager } from './RamadanManager';

export const metadata: Metadata = {
  title: 'Komuniti — MosRev',
  description: 'Urus profil komuniti dan program Ramadan masjid.',
};

export default async function CommunityPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');
  await requireActiveSubscription(session.orgId);

  // Fetch org slug for the public link alongside the org-scoped data.
  const [orgRow, profile, programs] = await Promise.all([
    prismaAdmin.organization.findUnique({
      where: { id: session.orgId },
      select: { slug: true },
    }),
    withOrg(session.orgId, async (tx) =>
      tx.mosqueProfile.findUnique({ where: { orgId: session.orgId } })
    ),
    withOrg(session.orgId, async (tx) =>
      tx.ramadanProgram.findMany({
        where: { orgId: session.orgId },
        orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
      })
    ),
  ]);

  const slug = orgRow?.slug ?? '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Komuniti</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Profil awam dan program masjid</p>
      </div>

      <ProfileForm initial={profile} slug={slug} />
      <RamadanManager initial={programs} />
    </div>
  );
}
