import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { isOrgSubscribed } from "@/lib/require-subscription";
import { roleSatisfies } from "@/lib/roles";
import { validateImageUpload } from "@/lib/upload";

const json = (b: unknown, status = 200, extra: Record<string, string> = {}) =>
  NextResponse.json(b, { status, headers: { "Cache-Control": "no-store", ...extra } });

/** Admin uploads the mosque's DuitNow / bank QR. Replaces any existing QR. */
export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return json({ error: "Unauthorized" }, 401);
    if (!session.orgId) return json({ error: "No active organization" }, 400);
    if (!(await isOrgSubscribed(session.orgId))) return json({ error: "Subscription required" }, 402);
    if (!roleSatisfies(session.orgRole, "admin")) return json({ error: "Forbidden" }, 403);
    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return json({ error: "Invalid CSRF token" }, 403);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Tiada fail" }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = validateImageUpload(bytes, file.type);
    if (!check.ok) return json({ error: check.error }, 400);

    const orgId = session.orgId;
    const imageId = await withOrg(orgId, async (tx) => {
      const profile = await tx.mosqueProfile.findUnique({
        where: { orgId },
        select: { paymentQrImageId: true },
      });
      if (!profile) throw new Error("NO_PROFILE");
      const img = await tx.uploadedImage.create({
        data: { orgId, mime: check.mime, sizeBytes: bytes.length, data: Buffer.from(bytes) },
      });
      await tx.mosqueProfile.update({ where: { orgId }, data: { paymentQrImageId: img.id } });
      if (profile.paymentQrImageId) {
        await tx.uploadedImage.deleteMany({ where: { id: profile.paymentQrImageId } });
      }
      return img.id;
    });

    return json({ data: { imageId } }, 201, { "X-CSRF-Token": csrf.newToken });
  } catch (error) {
    if (error instanceof Error && error.message === "NO_PROFILE") {
      return json({ error: "Simpan profil dahulu sebelum memuat naik QR" }, 400);
    }
    console.error("POST /api/community/payment-qr error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
