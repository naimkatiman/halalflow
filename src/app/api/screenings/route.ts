import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getQuote, HubUnavailableError, SymbolNotFoundError } from "@/lib/market-data";
import type { Quote } from "@/lib/market-data";
import { getFundamentals, type HubFundamentals } from "@/lib/market-data/hub-client";

const screeningSchema = z.object({
  stockId: z.string().min(1),
  result: z.enum(["COMPLIANT", "NON_COMPLIANT", "DOUBTFUL"]),
  ratios: z.string(),
  method: z.enum(["AAOIFI", "DJIM", "MSCI"]),
});

interface PriceContext {
  price: number;
  change: number;
  percentChange: number;
  timestamp: string;
}

async function safeGetPriceContext(ticker: string): Promise<PriceContext | null> {
  try {
    const quote: Quote = await getQuote(ticker);
    return {
      price: quote.price,
      change: quote.change,
      percentChange: quote.percent_change,
      timestamp: quote.timestamp,
    };
  } catch (error) {
    if (error instanceof HubUnavailableError || error instanceof SymbolNotFoundError) {
      return null;
    }
    return null;
  }
}

async function safeGetFundamentals(ticker: string): Promise<HubFundamentals | null> {
  try {
    return await getFundamentals(ticker);
  } catch (error) {
    if (error instanceof HubUnavailableError || error instanceof SymbolNotFoundError) {
      return null;
    }
    return null;
  }
}

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

    const uniqueTickers = Array.from(
      new Set(data.map((row) => row.stock?.ticker).filter((t): t is string => !!t))
    );
    const [priceEntries, fundamentalsEntries] = await Promise.all([
      Promise.all(
        uniqueTickers.map(async (ticker) => [ticker, await safeGetPriceContext(ticker)] as const)
      ),
      Promise.all(
        uniqueTickers.map(async (ticker) => [ticker, await safeGetFundamentals(ticker)] as const)
      ),
    ]);
    const priceByTicker = new Map(priceEntries);
    const fundamentalsByTicker = new Map(fundamentalsEntries);

    const enriched = data.map((row) => ({
      ...row,
      currentPrice: row.stock?.ticker ? priceByTicker.get(row.stock.ticker) ?? null : null,
      fundamentals: row.stock?.ticker
        ? fundamentalsByTicker.get(row.stock.ticker) ?? null
        : null,
    }));

    return NextResponse.json(
      { data: enriched, total, page, totalPages: Math.ceil(total / limit) },
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
    const [currentPrice, fundamentals] = screening.stock?.ticker
      ? await Promise.all([
          safeGetPriceContext(screening.stock.ticker),
          safeGetFundamentals(screening.stock.ticker),
        ])
      : [null, null];
    return NextResponse.json(
      { ...screening, currentPrice, fundamentals },
      { status: 201 }
    );
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
