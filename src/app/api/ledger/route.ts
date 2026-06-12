import { zodErrorMessage } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { isOrgSubscribed } from "@/lib/require-subscription";
import { roleSatisfies } from "@/lib/roles";
import { FUNDS, fundTotals } from "@/lib/ledger";
import { z } from "zod";

const PAGE_SIZE = 20;

const entrySchema = z.object({
  fund: z.enum(FUNDS),
  direction: z.enum(["in", "out"]),
  amount: z.number().int().positive().max(100_000_000),
  description: z.string().trim().min(1).max(300),
  entryDate: z.coerce.date().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });

    const { searchParams } = new URL(request.url);
    const rawFund = searchParams.get("fund") ?? "";
    const fund = (FUNDS as ReadonlyArray<string>).includes(rawFund) ? rawFund : null;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

    const { entries, total, allEntries } = await withOrg(session.orgId, async (tx) => {
      const where = { orgId: session.orgId, ...(fund ? { fund } : {}) };
      const allWhere = { orgId: session.orgId };
      const [entries, total, allEntries] = await Promise.all([
        tx.ledgerEntry.findMany({
          where,
          orderBy: { entryDate: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        tx.ledgerEntry.count({ where }),
        tx.ledgerEntry.findMany({
          where: allWhere,
          select: { fund: true, direction: true, amount: true, description: true, entryDate: true, refType: true, refId: true },
        }),
      ]);
      return { entries, total, allEntries };
    });

    const totals = fundTotals(allEntries);

    return NextResponse.json(
      { data: entries, totals, pagination: { page, limit: PAGE_SIZE, total, pages: Math.ceil(total / PAGE_SIZE) } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/ledger error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });
    if (!roleSatisfies(session.orgRole, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const body = await request.json();
    const parsed = entrySchema.parse(body);

    const data = await withOrg(session.orgId, async (tx) =>
      tx.ledgerEntry.create({
        data: {
          ...parsed,
          orgId: session.orgId,
          createdById: session.userId,
        },
      }),
    );

    return NextResponse.json(
      { data },
      { status: 201, headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("POST /api/ledger error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
