import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { SessionData, sessionOptions } from '@/lib/session';
import { withOrg } from '@/lib/db';
import { requireActiveSubscription } from '@/lib/require-subscription';
import { FacilityForm } from '../FacilityForm';
import { DeleteButton } from '@/components/DeleteButton';

export const metadata: Metadata = {
  title: 'Edit Kemudahan — MosRev',
};

export default async function EditFacilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');
  await requireActiveSubscription(session.orgId);

  const { id } = await params;

  const facility = await withOrg(session.orgId, async (tx) =>
    tx.facility.findFirst({ where: { id, orgId: session.orgId } })
  );
  if (!facility) notFound();

  return (
    <div className="space-y-6">
      <FacilityForm initial={facility} />
      <div className="max-w-2xl">
        <div className="border-t border-zinc-200 pt-6">
          <p className="text-sm font-medium text-zinc-700 mb-3">Zon berbahaya</p>
          <DeleteButton
            endpoint={`/api/facilities/${id}`}
            redirectTo="/facilities"
            confirmMessage={`Padam kemudahan "${facility.name}"? Tindakan ini tidak boleh dibuat asal.`}
            label="Padam kemudahan"
          />
        </div>
      </div>
    </div>
  );
}
