import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Buildings } from '@phosphor-icons/react/dist/ssr';
import { SessionData, sessionOptions } from '@/lib/session';
import { withOrg } from '@/lib/db';
import { requireActiveSubscription } from '@/lib/require-subscription';
import { formatMYR } from '@/lib/money';
import { FACILITY_TYPE_LABELS } from '@/lib/bookings';

export const metadata: Metadata = {
  title: 'Kemudahan — MosRev',
  description: 'Urus kemudahan masjid yang boleh ditempah.',
};

export default async function FacilitiesPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');
  await requireActiveSubscription(session.orgId);

  const facilities = await withOrg(session.orgId, async (tx) =>
    tx.facility.findMany({
      where: { orgId: session.orgId },
      orderBy: { createdAt: 'asc' },
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Kemudahan</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{facilities.length} kemudahan</p>
        </div>
        <Link
          href="/facilities/new"
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" weight="bold" aria-hidden="true" />
          Kemudahan baharu
        </Link>
      </div>

      {facilities.length === 0 ? (
        <div className="bg-white border border-zinc-200/70 border-dashed rounded-xl p-12 text-center">
          <Buildings className="w-8 h-8 text-zinc-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-zinc-500">Tiada kemudahan didaftarkan</p>
          <p className="text-xs text-zinc-400 mt-1 mb-4">Daftarkan dewan, bilik atau khemah untuk mula terima tempahan.</p>
          <Link
            href="/facilities/new"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" weight="bold" aria-hidden="true" />
            Kemudahan baharu
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/70 rounded-xl divide-y divide-zinc-100">
          {facilities.map((f) => (
            <div key={f.id} className="flex items-center gap-4 px-5 py-4">
              {f.photoUrl ? (
                <img
                  src={f.photoUrl}
                  alt={f.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0 bg-zinc-100"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                  <Buildings className="w-5 h-5 text-zinc-400" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-zinc-950">{f.name}</span>
                  <span className="text-xs text-zinc-400">{FACILITY_TYPE_LABELS[f.type] ?? f.type}</span>
                  {!f.active && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                      Tidak aktif
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5 space-x-2">
                  <span>Kapasiti: {f.capacity}</span>
                  <span>·</span>
                  <span>Kariah: {formatMYR(f.rateKariah)}</span>
                  <span>·</span>
                  <span>Awam: {formatMYR(f.rateAwam)}</span>
                  {f.rateNote && (
                    <>
                      <span>·</span>
                      <span>{f.rateNote}</span>
                    </>
                  )}
                </div>
              </div>
              <Link
                href={`/facilities/${f.id}`}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 shrink-0 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-emerald-200 transition-colors"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
