import { zodErrorMessage } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { isOrgSubscribed } from "@/lib/require-subscription";
import { roleSatisfies } from "@/lib/roles";
import { MALAYSIAN_STATES } from "@/lib/states";
import { z } from "zod";

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.enum(MALAYSIAN_STATES),
  phone: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  photoUrl: z.string().trim().max(500)
    .refine((v) => v === "" || /^https:\/\//.test(v) || (v.startsWith("/") && !v.startsWith("//")), {
      message: "Photo must be an https URL or a local path",
    })
    .or(z.literal(""))
    .optional(),
  visitorsWelcome: z.boolean().default(false),
  visitorHours: z.string().trim().max(200).optional(),
  dressCode: z.string().trim().max(300).optional(),
  tourAvailable: z.boolean().default(false),
  tourNote: z.string().trim().max(500).optional(),
  pantryAvailable: z.boolean().default(false),
  pantryType: z.enum(["open", "asnaf"]).optional(),
  pantryHours: z.string().trim().max(200).optional(),
  pantryNote: z.string().trim().max(500).optional(),
  published: z.boolean().default(false),
});

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });

    const data = await withOrg(session.orgId, async (tx) =>
      tx.mosqueProfile.findUnique({ where: { orgId: session.orgId } }),
    );

    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/community/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });
    if (!roleSatisfies(session.orgRole, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const body = await request.json();
    const parsed = profileSchema.parse(body);

    const { photoUrl: parsedPhotoUrl, ...rest } = parsed;
    const photoUrl = parsedPhotoUrl || null;
    const data = await withOrg(session.orgId, async (tx) =>
      tx.mosqueProfile.upsert({
        where: { orgId: session.orgId },
        create: { ...rest, photoUrl, orgId: session.orgId },
        update: { ...rest, photoUrl },
      }),
    );

    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("PUT /api/community/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
