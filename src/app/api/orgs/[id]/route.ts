import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const member = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId: id, userId: session.userId } },
    });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const org = await prisma.organization.findUnique({
      where: { id },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });

    return NextResponse.json({ org });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
