import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getCompanies } from "@/data/companies";
import { HubUnavailableError, SymbolNotFoundError } from "@/lib/market-data/errors";

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

    let companies = await getCompanies();

    if (status) companies = companies.filter((c) => c.screening?.status === status);
    if (sector) companies = companies.filter((c) => c.sector === sector);
    if (exchange) companies = companies.filter((c) => c.exchange === exchange);
    if (country) companies = companies.filter((c) => c.country === country);

    companies.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sort];
      const bv = (b as unknown as Record<string, unknown>)[sort];
      if (av == null || bv == null) return 0;
      if (av < bv) return order === "asc" ? -1 : 1;
      if (av > bv) return order === "asc" ? 1 : -1;
      return 0;
    });

    const total = companies.length;
    const data = companies.slice((page - 1) * limit, page * limit);

    return NextResponse.json(
      { data, total, page, totalPages: Math.ceil(total / limit) },
      {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    if (error instanceof HubUnavailableError) {
      return NextResponse.json(
        { error: "Market data hub unavailable" },
        { status: 503, headers: { "Retry-After": "30" } }
      );
    }
    if (error instanceof SymbolNotFoundError) {
      return NextResponse.json(
        { error: `Symbol not found: ${error.symbol}` },
        { status: 404 }
      );
    }
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
