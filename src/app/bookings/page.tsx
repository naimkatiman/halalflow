import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr';
import { SessionData, sessionOptions } from '@/lib/session';
import { withOrg } from '@/lib/db';
import { requireActiveSubscription } from '@/lib/require-subscription';
import { BOOKING_STATUSES, EVENT_TYPE_LABELS } from '@/lib/bookings';
import { BookingStatusBadge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Tempahan — MosRev',
  description: 'Semak dan lulus tempahan kemudahan masjid.',
};

const STATUS_LABELS: Record<string, string> = {
  requested: 'Menunggu',
  approved: 'Diluluskan',
  paid: 'Dibayar',
  completed: 'Selesai',
  declined: 'Ditolak',
  cancelled: 'Dibatal',
};

const PAGE_SIZE = 20;

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');
  await requireActiveSubscription(session.orgId);

  const { status: rawStatus, page: pageRaw } = await searchParams;
  // When no filter is selected, default the query to "requested" so the admin
  // lands on the actionable queue. The "Semua" pill sets rawStatus to undefined.
  const status = (BOOKING_STATUSES as ReadonlyArray<string>).includes(rawStatus ?? '')
    ? rawStatus
    : rawStatus === undefined
    ? 'requested'
    : null;
  const page = Math.max(1, Number(pageRaw ?? '1'));

  const { bookings, total } = await withOrg(session.orgId, async (tx) => {
    const where = { orgId: session.orgId, ...(status ? { status } : {}) };
    const [bookings, total] = await Promise.all([
      tx.facilityBooking.findMany({
        where,
        include: { facility: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      tx.facilityBooking.count({ where }),
    ]);
    return { bookings, total };
  });

  const pages = Math.ceil(total / PAGE_SIZE);
  const filters = ['', ...BOOKING_STATUSES] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Tempahan</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{total} tempahan</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((f) => {
          const active = f === '' ? !rawStatus : rawStatus === f;
          return (
            <Link
              key={f || 'all'}
              href={f ? `/bookings?status=${f}` : '/bookings'}
              aria-current={active ? 'true' : undefined}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                active
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {f ? (STATUS_LABELS[f] ?? f) : 'Semua'}
            </Link>
          );
        })}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-4 py-3">
          <p className="text-sm text-zinc-500">
            Halaman {page} daripada {pages} · {total} jumlah
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={status ? `?status=${status}&page=${page - 1}` : `?page=${page - 1}`}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-emerald-200 transition-colors"
              >
                Sebelum
              </Link>
            )}
            {page < pages && (
              <Link
                href={status ? `?status=${status}&page=${page + 1}` : `?page=${page + 1}`}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-emerald-200 transition-colors"
              >
                Seterusnya
              </Link>
            )}
          </div>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="bg-white border border-zinc-200/70 border-dashed rounded-xl p-12 text-center">
          <CalendarCheck className="w-8 h-8 text-zinc-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-zinc-500">Tiada tempahan ditemui</p>
          <p className="text-xs text-zinc-400 mt-1">
            {rawStatus ? 'Cuba penapis lain.' : 'Tempahan baharu akan muncul di sini.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/70 rounded-xl divide-y divide-zinc-100">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/bookings/${b.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-zinc-950 group-hover:text-emerald-700 transition-colors">
                    {b.applicantName}
                  </span>
                  {b.isKariah && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Kariah
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5 space-x-1.5">
                  <span>{b.facility.name}</span>
                  <span>·</span>
                  <span>{EVENT_TYPE_LABELS[b.eventType] ?? b.eventType}</span>
                  <span>·</span>
                  <span>{new Date(b.eventDate).toLocaleDateString('ms-MY')}</span>
                  <span>·</span>
                  <span>{b.pax} pax</span>
                </div>
              </div>
              <div className="shrink-0 ml-4">
                <BookingStatusBadge status={b.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
