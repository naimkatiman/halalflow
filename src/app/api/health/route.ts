import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  let db = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    db = err instanceof Error ? err.message : "unreachable";
    return NextResponse.json(
      { status: "degraded", db, uptime: process.uptime(), timestamp: Date.now() },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "ok",
    db,
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
}
