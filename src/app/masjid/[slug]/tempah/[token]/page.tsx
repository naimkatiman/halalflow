import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle, Bank, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { prismaAdmin } from "@/lib/db";
import { BookingStatusBadge } from "@/components/ui/Badge";
import { EVENT_TYPE_LABELS } from "@/lib/bookings";
import { formatMYR } from "@/lib/money";
import { ReceiptUpload } from "./ReceiptUpload";

export async function generateMetadata(): Promise<Metadata> {
  // Status pages are private (token-addressed) — keep them out of search indexes.
  return { title: "Status Tempahan — MosRev", robots: { index: false, follow: false } };
}

async function loadBooking(token: string) {
  return prismaAdmin.facilityBooking.findUnique({
    where: { publicToken: token },
    select: {
      reference: true, status: true, eventType: true, eventDate: true, startTime: true,
      endTime: true, pax: true, applicantName: true, quotedAmount: true, amountDue: true,
      paidAmount: true, declineReason: true, receiptImageId: true,
      facility: { select: { name: true } },
      org: {
        select: {
          slug: true,
          mosqueProfile: {
            select: {
              displayName: true, whatsapp: true, bankName: true, bankAccountNo: true,
              bankAccountHolder: true, paymentInstructions: true, paymentQrImageId: true, published: true,
            },
          },
        },
      },
    },
  });
}

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  const booking = await loadBooking(token);
  if (!booking || booking.org.slug !== slug || !booking.org.mosqueProfile?.published) notFound();

  const profile = booking.org.mosqueProfile;
  const payNow = booking.amountDue ?? booking.quotedAmount ?? 0;
  const isPaymentStage = booking.status === "approved" || booking.status === "payment_review";
  const waDigits = (profile.whatsapp ?? "").replace(/\D/g, "");
  const waText = encodeURIComponent(`Salam, rujukan tempahan saya: ${booking.reference}.`);

  return (
    <div className="max-w-screen-md mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700 mb-1">{profile.displayName}</p>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-extrabold tracking-tight text-emerald-950">Status Tempahan</h1>
          <BookingStatusBadge status={booking.status} />
        </div>
        <p className="mt-1 text-sm text-zinc-500 font-mono">Rujukan: {booking.reference}</p>
      </div>

      {/* Status message */}
      {booking.status === "requested" && (
        <div className="bg-white border border-zinc-200/70 rounded-xl p-5 text-sm text-zinc-700">
          Permohonan anda sedang disemak oleh pejabat masjid. Anda akan dimaklumkan sebutharga sebaik sahaja diluluskan.
        </div>
      )}

      {isPaymentStage && (
        <div className="bg-white border border-zinc-200/70 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bank className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            <h2 className="text-base font-bold text-emerald-950">Pembayaran</h2>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
            <p className="text-sm text-zinc-600">Jumlah untuk dibayar sekarang</p>
            <p className="text-2xl font-extrabold text-emerald-800">{formatMYR(payNow)}</p>
          </div>

          {(profile.bankName || profile.bankAccountNo || profile.bankAccountHolder) && (
            <dl className="text-sm space-y-1">
              {profile.bankName && <div className="flex justify-between gap-4"><dt className="text-zinc-500">Bank</dt><dd className="font-medium text-zinc-900">{profile.bankName}</dd></div>}
              {profile.bankAccountNo && <div className="flex justify-between gap-4"><dt className="text-zinc-500">No. akaun</dt><dd className="font-medium text-zinc-900 font-mono">{profile.bankAccountNo}</dd></div>}
              {profile.bankAccountHolder && <div className="flex justify-between gap-4"><dt className="text-zinc-500">Pemegang akaun</dt><dd className="font-medium text-zinc-900">{profile.bankAccountHolder}</dd></div>}
            </dl>
          )}

          {profile.paymentQrImageId && (
            <div>
              <p className="text-sm text-zinc-500 mb-2">Imbas QR DuitNow</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/uploads/${profile.paymentQrImageId}`} alt="QR pembayaran" className="h-48 w-48 object-contain rounded-lg border border-zinc-200" />
            </div>
          )}

          {profile.paymentInstructions && (
            <p className="text-sm text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-lg p-3 leading-relaxed">{profile.paymentInstructions}</p>
          )}

          <div className="border-t border-zinc-100 pt-4">
            {booking.status === "payment_review" && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                Resit anda sedang disemak oleh pejabat. Anda boleh muat naik semula jika perlu.
              </p>
            )}
            <p className="text-sm font-medium text-zinc-700 mb-2">Muat naik resit bayaran</p>
            <ReceiptUpload token={token} currentStatus={booking.status} />
          </div>
        </div>
      )}

      {booking.status === "paid" && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" weight="duotone" aria-hidden="true" />
          <h2 className="text-lg font-bold text-emerald-900 mb-1">Tempahan disahkan</h2>
          <p className="text-sm text-emerald-800">Bayaran anda telah disahkan dan slot anda telah ditempah.</p>
        </div>
      )}

      {booking.status === "completed" && (
        <div className="bg-white border border-zinc-200/70 rounded-xl p-5 text-sm text-zinc-700">Tempahan ini telah selesai. Terima kasih.</div>
      )}

      {(booking.status === "declined" || booking.status === "cancelled") && (
        <div className="bg-danger-tint border border-danger-line rounded-xl p-5 text-sm text-danger-strong">
          {booking.status === "declined" ? "Permohonan ini telah ditolak." : "Tempahan ini telah dibatalkan."}
          {booking.declineReason && <span className="block mt-1 text-zinc-600">Sebab: {booking.declineReason}</span>}
        </div>
      )}

      {/* Event summary */}
      <div className="bg-white border border-zinc-200/70 rounded-xl px-5 py-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Butiran acara</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><dt className="text-zinc-400 text-xs">Kemudahan</dt><dd className="font-medium text-zinc-900">{booking.facility.name}</dd></div>
          <div><dt className="text-zinc-400 text-xs">Jenis acara</dt><dd className="font-medium text-zinc-900">{EVENT_TYPE_LABELS[booking.eventType] ?? booking.eventType}</dd></div>
          <div><dt className="text-zinc-400 text-xs">Tarikh</dt><dd className="font-medium text-zinc-900">{new Date(booking.eventDate).toLocaleDateString("ms-MY")}</dd></div>
          <div><dt className="text-zinc-400 text-xs">Masa</dt><dd className="font-medium text-zinc-900">{booking.startTime} – {booking.endTime}</dd></div>
          <div><dt className="text-zinc-400 text-xs">Pax</dt><dd className="font-medium text-zinc-900">{booking.pax}</dd></div>
          <div><dt className="text-zinc-400 text-xs">Pemohon</dt><dd className="font-medium text-zinc-900">{booking.applicantName}</dd></div>
        </dl>
      </div>

      {waDigits && (
        <a
          href={`https://wa.me/${waDigits}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <WhatsappLogo className="w-4 h-4" aria-hidden="true" />
          WhatsApp Pejabat Masjid
        </a>
      )}
    </div>
  );
}
