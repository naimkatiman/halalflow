import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { isOrgSubscribed } from "@/lib/require-subscription";
import { ledgerCsv } from "@/lib/ledger";

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });

    const entries = await withOrg(session.orgId, async (tx) =>
      tx.ledgerEntry.findMany({
        where: { orgId: session.orgId },
        orderBy: { entryDate: "asc" },
      }),
    );

    return new NextResponse(ledgerCsv(entries), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="penyata-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/ledger/export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
