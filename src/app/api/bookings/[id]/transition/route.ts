import { zodErrorMessage } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { isOrgSubscribed } from "@/lib/require-subscription";
import { roleSatisfies } from "@/lib/roles";
import { BOOKING_ACTIONS, canTransition, resolveAction, validateActionInput } from "@/lib/bookings";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const transitionSchema = z.object({
  action: z.enum(BOOKING_ACTIONS),
  quotedAmount: z.number().int().positive().max(100_000_000).optional(),
  depositAmount: z.number().int().min(0).max(100_000_000).optional(),
  declineReason: z.string().trim().max(500).optional(),
  paymentAmount: z.number().int().positive().max(100_000_000).optional(),
  paymentNote: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (!session.orgId) return NextResponse.json({ error: "No active organization" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!(await isOrgSubscribed(session.orgId))) return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });
    if (!roleSatisfies(session.orgRole, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    const body = await request.json();
    const parsed = transitionSchema.parse(body);

    const result = await withOrg(session.orgId, async (tx) => {
      const booking = await tx.facilityBooking.findFirst({ where: { id, orgId: session.orgId } });
      if (!booking) return { error: "Booking not found", status: 404 } as const;

      const target = resolveAction(parsed.action);
      if (!canTransition(booking.status, target)) {
        return { error: `Cannot ${parsed.action} a booking in status ${booking.status}`, status: 400 } as const;
      }

      const inputCheck = validateActionInput(parsed.action, parsed);
      if (!inputCheck.ok) return { error: inputCheck.error, status: 400 } as const;

      const now = new Date();
      const updated = await tx.facilityBooking.update({
        where: { id: booking.id },
        data: {
          status: target,
          ...(parsed.action === "approve" && {
            quotedAmount: parsed.quotedAmount,
            depositAmount: parsed.depositAmount ?? null,
            decidedById: session.userId,
            decidedAt: now,
          }),
          ...(parsed.action === "decline" && {
            declineReason: parsed.declineReason,
            decidedById: session.userId,
            decidedAt: now,
          }),
          ...(parsed.action === "record_payment" && {
            paidAt: now,
            paymentNote: parsed.paymentNote ?? null,
          }),
        },
      });

      if (parsed.action === "record_payment") {
        await tx.ledgerEntry.create({
          data: {
            orgId: session.orgId,
            fund: "sewaan",
            direction: "in",
            amount: parsed.paymentAmount!,
            description: `Sewaan: ${booking.applicantName} (${booking.eventType})`,
            refType: "booking",
            refId: booking.id,
            entryDate: now,
            createdById: session.userId,
          },
        });
      }

      return { data: updated } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(
      { data: result.data },
      { headers: { "Cache-Control": "no-store", "X-CSRF-Token": csrf.newToken } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Booking not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    console.error("POST /api/bookings/[id]/transition error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
