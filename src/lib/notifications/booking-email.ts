import { type EmailMessage, escapeHtml } from "./email";
import { formatMYR } from "@/lib/money";

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");
}

/** Public, no-login status + payment page for a booking. */
export function bookingStatusUrl(slug: string, token: string): string {
  return `${baseUrl()}/masjid/${slug}/tempah/${token}`;
}

/** Authenticated admin booking detail page. */
export function adminBookingUrl(bookingId: string): string {
  return `${baseUrl()}/bookings/${bookingId}`;
}

function shell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #27272a;">
  <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">${escapeHtml(title)}</h2>
  ${bodyHtml}
  <p style="font-size: 12px; color: #71717a; margin-top: 16px;">Notifikasi automatik daripada MosRev.</p>
</body>
</html>`;
}

function linkButton(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display: inline-block; background: #059669; color: #fff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 10px 20px; border-radius: 8px;">${escapeHtml(label)}</a>`;
}

export interface RequestCustomerInput {
  to: string;
  reference: string;
  slug: string;
  token: string;
  mosqueName: string;
  facilityName: string;
  eventDate: string;
}

export function buildBookingRequestCustomerEmail(i: RequestCustomerInput): EmailMessage {
  const url = bookingStatusUrl(i.slug, i.token);
  const subject = `[MosRev] Permohonan tempahan diterima — ${i.reference}`;
  const text = `Salam,

Permohonan tempahan anda di ${i.mosqueName} telah diterima.

Rujukan: ${i.reference}
Kemudahan: ${i.facilityName}
Tarikh: ${i.eventDate}

Pejabat masjid akan menyemak permohonan dan menghantar sebutharga. Semak status dan buat bayaran di:
${url}

— MosRev`;
  const html = shell("Permohonan tempahan diterima", `
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 8px;">Permohonan tempahan anda di <strong>${escapeHtml(i.mosqueName)}</strong> telah diterima.</p>
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">Rujukan: <strong>${escapeHtml(i.reference)}</strong><br/>Kemudahan: ${escapeHtml(i.facilityName)}<br/>Tarikh: ${escapeHtml(i.eventDate)}</p>
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">Pejabat masjid akan menyemak dan menghantar sebutharga.</p>
  ${linkButton(url, "Semak Status & Bayar")}`);
  return { to: i.to, subject, text, html };
}

export interface RequestOfficeInput {
  to: string | string[];
  reference: string;
  bookingId: string;
  mosqueName: string;
  facilityName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  pax: number;
  applicantName: string;
  applicantPhone: string;
}

export function buildBookingRequestOfficeEmail(i: RequestOfficeInput): EmailMessage {
  const url = adminBookingUrl(i.bookingId);
  const subject = `[MosRev] Tempahan baharu — ${i.reference}`;
  const text = `Tempahan baharu di ${i.mosqueName}.

Rujukan: ${i.reference}
Kemudahan: ${i.facilityName}
Tarikh: ${i.eventDate}, ${i.startTime}–${i.endTime}
Anggaran pax: ${i.pax}
Pemohon: ${i.applicantName} (${i.applicantPhone})
Booking: ${i.bookingId}

Semak dan luluskan: ${url}

— MosRev`;
  const html = shell("Tempahan baharu", `
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">Tempahan baharu di <strong>${escapeHtml(i.mosqueName)}</strong>.<br/>Rujukan: <strong>${escapeHtml(i.reference)}</strong><br/>Kemudahan: ${escapeHtml(i.facilityName)}<br/>Tarikh: ${escapeHtml(i.eventDate)}, ${escapeHtml(i.startTime)}–${escapeHtml(i.endTime)}<br/>Pax: ${i.pax}<br/>Pemohon: ${escapeHtml(i.applicantName)} (${escapeHtml(i.applicantPhone)})</p>
  ${linkButton(url, "Semak Tempahan")}`);
  return { to: i.to, subject, text, html };
}

export interface ApprovedCustomerInput {
  to: string;
  reference: string;
  slug: string;
  token: string;
  mosqueName: string;
  amountDueSen: number;
  quotedSen?: number;
}

export function buildBookingApprovedCustomerEmail(i: ApprovedCustomerInput): EmailMessage {
  const url = bookingStatusUrl(i.slug, i.token);
  const subject = `[MosRev] Sebutharga tempahan ${i.reference}`;
  const amount = formatMYR(i.amountDueSen);
  const text = `Salam,

Tempahan anda (${i.reference}) di ${i.mosqueName} telah diluluskan.

Jumlah untuk dibayar sekarang: ${amount}
${i.quotedSen ? `Jumlah sebutharga penuh: ${formatMYR(i.quotedSen)}\n` : ""}
Sila buat bayaran ke akaun/QR masjid dan muat naik resit di:
${url}

— MosRev`;
  const html = shell("Sebutharga tempahan", `
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 8px;">Tempahan <strong>${escapeHtml(i.reference)}</strong> di <strong>${escapeHtml(i.mosqueName)}</strong> telah diluluskan.</p>
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">Jumlah untuk dibayar sekarang: <strong>${escapeHtml(amount)}</strong></p>
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">Sila buat bayaran dan muat naik resit:</p>
  ${linkButton(url, "Bayar & Muat Naik Resit")}`);
  return { to: i.to, subject, text, html };
}

export interface ReceiptOfficeInput {
  to: string | string[];
  reference: string;
  bookingId: string;
  mosqueName: string;
  applicantName: string;
  facilityName: string;
}

export function buildBookingReceiptOfficeEmail(i: ReceiptOfficeInput): EmailMessage {
  const url = adminBookingUrl(i.bookingId);
  const subject = `[MosRev] Resit dimuat naik — ${i.reference}`;
  const text = `Resit bayaran telah dimuat naik untuk tempahan ${i.reference} di ${i.mosqueName}.

Pemohon: ${i.applicantName}
Kemudahan: ${i.facilityName}
Booking: ${i.bookingId}

Sila semak resit dan sahkan bayaran: ${url}

— MosRev`;
  const html = shell("Resit dimuat naik", `
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">Resit bayaran dimuat naik untuk tempahan <strong>${escapeHtml(i.reference)}</strong> di <strong>${escapeHtml(i.mosqueName)}</strong>.<br/>Pemohon: ${escapeHtml(i.applicantName)}<br/>Kemudahan: ${escapeHtml(i.facilityName)}</p>
  ${linkButton(url, "Semak & Sahkan Bayaran")}`);
  return { to: i.to, subject, text, html };
}

export interface ConfirmedCustomerInput {
  to: string;
  reference: string;
  slug: string;
  token: string;
  mosqueName: string;
}

export function buildBookingConfirmedCustomerEmail(i: ConfirmedCustomerInput): EmailMessage {
  const url = bookingStatusUrl(i.slug, i.token);
  const subject = `[MosRev] Tempahan disahkan — ${i.reference}`;
  const text = `Salam,

Bayaran anda telah disahkan. Tempahan ${i.reference} di ${i.mosqueName} kini telah ditempah.

Semak butiran: ${url}

Terima kasih.

— MosRev`;
  const html = shell("Tempahan disahkan", `
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">Bayaran anda telah disahkan. Tempahan <strong>${escapeHtml(i.reference)}</strong> di <strong>${escapeHtml(i.mosqueName)}</strong> kini telah ditempah.</p>
  ${linkButton(url, "Lihat Butiran Tempahan")}`);
  return { to: i.to, subject, text, html };
}
