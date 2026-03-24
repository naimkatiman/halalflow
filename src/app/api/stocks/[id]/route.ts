import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  ticker: z.string().min(1).max(10).optional(),
  name: z.string().min(1).optional(),
  exchange: z.string().min(1).optional(),
  sector: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  debtRatio: z.number().min(0).max(1).optional(),
  cashRatio: z.number().min(0).max(1).optional(),
  revenueRatio: z.number().min(0).max(1).optional(),
  status: z.enum(["COMPLIANT", "NON_COMPLIANT", "DOUBTFUL"]).optional(),
  score: z.number().min(0).max(100).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stock = await prisma.stock.findUnique({
      where: { id },
      include: { screenings: true },
    });
    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }
    return NextResponse.json(stock, {
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateSchema.parse(body);
    const stock = await prisma.stock.update({
      where: { id },
      data: { ...validated, lastUpdated: new Date() },
    });
    return NextResponse.json(stock);
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
    await prisma.screening.deleteMany({ where: { stockId: id } });
    await prisma.stock.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
