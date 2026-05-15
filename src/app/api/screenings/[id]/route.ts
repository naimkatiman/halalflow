import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  getQuote,
  HubUnavailableError,
  SymbolNotFoundError,
  type Quote,
} from "@/lib/market-data";
import { getFundamentals, type HubFundamentals } from "@/lib/market-data/hub-client";

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

const updateSchema = z.object({
  result: z.enum(["COMPLIANT", "NON_COMPLIANT", "DOUBTFUL"]).optional(),
  ratios: z.string().optional(),
  method: z.enum(["AAOIFI", "DJIM", "MSCI"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const screening = await prisma.screening.findUnique({
      where: { id },
      include: { stock: true },
    });
    if (!screening) {
      return NextResponse.json({ error: "Screening not found" }, { status: 404 });
    }
    const [currentPrice, fundamentals] = screening.stock?.ticker
      ? await Promise.all([
          safeGetPriceContext(screening.stock.ticker),
          safeGetFundamentals(screening.stock.ticker),
        ])
      : [null, null];
    return NextResponse.json({ ...screening, currentPrice, fundamentals });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateSchema.parse(body);
    const screening = await prisma.screening.update({
      where: { id },
      data: validated,
    });
    return NextResponse.json(screening);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.screening.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
