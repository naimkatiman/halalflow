import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { SessionData, sessionOptions } from '@/lib/session';
import { withOrg } from '@/lib/db';
import { requireActiveSubscription } from '@/lib/require-subscription';
import { EVENT_TYPE_LABELS } from '@/lib/bookings';
import { formatMYR } from '@/lib/money';
import { BookingStatusBadge } from '@/components/ui/Badge';
import { BookingActions } from './BookingActions';

export const metadata: Metadata = {
  title: 'Tempahan — MosRev',
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');
  await requireActiveSubscription(session.orgId);

  const { id } = await params;

  const booking = await withOrg(session.orgId, async (tx) =>
    tx.facilityBooking.findFirst({
      where: { id, orgId: session.orgId },
      include: { facility: { select: { name: true, type: true } } },
    })
  );
  if (!booking) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/bookings" aria-label="Kembali" className="text-zinc-400 hover:text-zinc-700 transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-zinc-950 tracking-tight truncate">
            {booking.applicantName}
          </h1>
          <BookingStatusBadge status={booking.status} />
        </div>
      </div>

      {/* Actions */}
      <BookingActions
        booking={{
          id: booking.id,
          status: booking.status,
          quotedAmount: booking.quotedAmount,
          depositAmount: booking.depositAmount,
        }}
      />

      {/* Event details */}
      <div className="bg-white border border-zinc-200/70 rounded-xl divide-y divide-zinc-100">
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Butiran acara</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-zinc-400 text-xs">Kemudahan</dt>
              <dd className="font-medium text-zinc-900">{booking.facility.name}</dd>
            </div>
            <div>
              <dt className="text-zinc-400 text-xs">Jenis acara</dt>
              <dd className="font-medium text-zinc-900">{EVENT_TYPE_LABELS[booking.eventType] ?? booking.eventType}</dd>
            </div>
            <div>
              <dt className="text-zinc-400 text-xs">Tarikh</dt>
              <dd className="font-medium text-zinc-900">{new Date(booking.eventDate).toLocaleDateString('ms-MY')}</dd>
            </div>
            <div>
              <dt className="text-zinc-400 text-xs">Masa</dt>
              <dd className="font-medium text-zinc-900">{booking.startTime} – {booking.endTime}</dd>
            </div>
            <div>
              <dt className="text-zinc-400 text-xs">Bilangan pax</dt>
              <dd className="font-medium text-zinc-900">{booking.pax}</dd>
            </div>
            {booking.notes && (
              <div className="col-span-2">
                <dt className="text-zinc-400 text-xs">Nota</dt>
                <dd className="font-medium text-zinc-900">{booking.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Applicant */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Pemohon</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-zinc-400 text-xs">Nama</dt>
              <dd className="font-medium text-zinc-900 flex items-center gap-2">
                {booking.applicantName}
                {booking.isKariah && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Kariah
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-400 text-xs">Telefon</dt>
              <dd className="font-medium text-zinc-900">
                <a href={`tel:${booking.applicantPhone}`} className="text-emerald-600 hover:text-emerald-700">
                  {booking.applicantPhone}
                </a>
              </dd>
            </div>
            {booking.applicantEmail && (
              <div>
                <dt className="text-zinc-400 text-xs">E-mel</dt>
                <dd className="font-medium text-zinc-900">{booking.applicantEmail}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Money */}
        {(booking.quotedAmount !== null || booking.depositAmount !== null || booking.paidAt) && (
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Kewangan</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {booking.quotedAmount !== null && (
                <div>
                  <dt className="text-zinc-400 text-xs">Sebutharga</dt>
                  <dd className="font-medium text-zinc-900">{formatMYR(booking.quotedAmount)}</dd>
                </div>
              )}
              {booking.depositAmount !== null && (
                <div>
                  <dt className="text-zinc-400 text-xs">Deposit</dt>
                  <dd className="font-medium text-zinc-900">{formatMYR(booking.depositAmount)}</dd>
                </div>
              )}
              {booking.paidAt && (
                <div>
                  <dt className="text-zinc-400 text-xs">Tarikh bayar</dt>
                  <dd className="font-medium text-zinc-900">{new Date(booking.paidAt).toLocaleDateString('ms-MY')}</dd>
                </div>
              )}
              {booking.paymentNote && (
                <div className="col-span-2">
                  <dt className="text-zinc-400 text-xs">Nota bayaran</dt>
                  <dd className="font-medium text-zinc-900">{booking.paymentNote}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Decision */}
        {(booking.declineReason || booking.decidedAt) && (
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Keputusan</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {booking.decidedAt && (
                <div>
                  <dt className="text-zinc-400 text-xs">Tarikh keputusan</dt>
                  <dd className="font-medium text-zinc-900">{new Date(booking.decidedAt).toLocaleDateString('ms-MY')}</dd>
                </div>
              )}
              {booking.declineReason && (
                <div className="col-span-2">
                  <dt className="text-zinc-400 text-xs">Sebab penolakan</dt>
                  <dd className="font-medium text-zinc-900">{booking.declineReason}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
