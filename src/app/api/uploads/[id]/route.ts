import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prismaAdmin } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { roleSatisfies } from "@/lib/roles";

/**
 * Serve an UploadedImage's bytes. Authorization (uses prismaAdmin because there
 * is no session org context on the public paths):
 *   (a) the image is a mosque payment QR  -> public,
 *   (b) the image is a booking receipt AND ?token= matches that booking,
 *   (c) an authenticated admin of the owning org.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token");

  const image = await prismaAdmin.uploadedImage.findUnique({ where: { id } });
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const isPaymentQr = await prismaAdmin.mosqueProfile.findFirst({
    where: { paymentQrImageId: id },
    select: { id: true },
  });
  let authorized = Boolean(isPaymentQr);

  if (!authorized && token) {
    const booking = await prismaAdmin.facilityBooking.findFirst({
      where: { receiptImageId: id, publicToken: token },
      select: { id: true },
    });
    authorized = Boolean(booking);
  }

  if (!authorized) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    authorized = Boolean(
      session.isLoggedIn && session.orgId === image.orgId && roleSatisfies(session.orgRole, "admin"),
    );
  }

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  return new NextResponse(Buffer.from(image.data), {
    status: 200,
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": "private, max-age=300",
      "Content-Length": String(image.sizeBytes),
    },
  });
}
