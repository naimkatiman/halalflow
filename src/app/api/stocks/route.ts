import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const stockSchema = z.object({
  ticker: z.string().min(1).max(10),
  name: z.string().min(1),
  exchange: z.string().min(1),
  sector: z.string().min(1),
  country: z.string().min(1),
  debtRatio: z.number().min(0).max(1),
  cashRatio: z.number().min(0).max(1),
  revenueRatio: z.number().min(0).max(1),
  status: z.enum(["COMPLIANT", "NON_COMPLIANT", "DOUBTFUL"]),
  score: z.number().min(0).max(100),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const sector = searchParams.get("sector");
    const exchange = searchParams.get("exchange");
    const country = searchParams.get("country");
    const sort = searchParams.get("sort") || "ticker";
    const order = searchParams.get("order") || "asc";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (sector) where.sector = sector;
    if (exchange) where.exchange = exchange;
    if (country) where.country = country;

    const [data, total] = await Promise.all([
      prisma.stock.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        include: { screenings: true },
      }),
      prisma.stock.count({ where }),
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
    const validated = stockSchema.parse(body);
    const stock = await prisma.stock.create({ data: validated });
    return NextResponse.json(stock, { status: 201 });
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
