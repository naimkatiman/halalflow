import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const member = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId: id, userId: session.userId } },
    });
    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    session.orgId = id;
    session.orgRole = member.role;
    await session.save();

    return NextResponse.json({ orgId: id, orgRole: member.role });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
