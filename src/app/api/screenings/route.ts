import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const screeningSchema = z.object({
  stockId: z.string().min(1),
  result: z.enum(["COMPLIANT", "NON_COMPLIANT", "DOUBTFUL"]),
  ratios: z.string(),
  method: z.enum(["AAOIFI", "DJIM", "MSCI"]),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const stockId = searchParams.get("stockId");
    const method = searchParams.get("method");

    const where: Record<string, unknown> = {};
    if (stockId) where.stockId = stockId;
    if (method) where.method = method;

    const [data, total] = await Promise.all([
      prisma.screening.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { stock: true },
      }),
      prisma.screening.count({ where }),
    ]);

    return NextResponse.json(
      { data, total, page, totalPages: Math.ceil(total / limit) },
      {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = screeningSchema.parse(body);
    const screening = await prisma.screening.create({
      data: validated,
      include: { stock: true },
    });
    return NextResponse.json(screening, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
