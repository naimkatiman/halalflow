import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parsePaginationParams, buildPaginatedResponse } from "@/lib/search";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sort, order, q, skip } = parsePaginationParams(searchParams);
    const filter = searchParams.get("filter");

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { ticker: { contains: q } },
        { name: { contains: q } },
        { sector: { contains: q } },
        { exchange: { contains: q } },
        { country: { contains: q } },
      ];
    }

    if (filter) {
      try {
        const filters = JSON.parse(filter);
        if (filters.status) where.status = filters.status;
        if (filters.sector) where.sector = filters.sector;
        if (filters.exchange) where.exchange = filters.exchange;
        if (filters.country) where.country = filters.country;
        if (filters.minScore) where.score = { gte: parseFloat(filters.minScore) };
      } catch {
        // ignore invalid filter JSON
      }
    }

    const validSortFields = ["ticker", "name", "score", "debtRatio", "lastUpdated", "createdAt"];
    const sortField = validSortFields.includes(sort) ? sort : "lastUpdated";

    const [data, total] = await Promise.all([
      prisma.stock.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: order },
        include: { screenings: { take: 1, orderBy: { createdAt: "desc" } } },
      }),
      prisma.stock.count({ where }),
    ]);

    return NextResponse.json(buildPaginatedResponse(data, total, page, limit), {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
