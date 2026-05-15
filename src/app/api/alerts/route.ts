import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";

const createAlertSchema = z.object({
  symbol: z.string().min(1).max(32),
  condition: z.enum(["above", "below"]),
  threshold: z.number().finite(),
  channel: z.enum(["telegram", "email"]),
  active: z.boolean().optional(),
});

async function requireSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn || !session.userId) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const rules = await prisma.alertRule.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ rules });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const rule = await prisma.alertRule.create({
      data: {
        userId: session.userId,
        symbol: parsed.data.symbol.toUpperCase(),
        condition: parsed.data.condition,
        threshold: parsed.data.threshold,
        channel: parsed.data.channel,
        active: parsed.data.active ?? true,
      },
    });
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
