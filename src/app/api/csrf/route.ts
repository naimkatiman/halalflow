import { NextResponse } from "next/server";
import { getCsrfToken } from "@/lib/csrf";

export async function GET() {
  try {
    const token = await getCsrfToken();
    return NextResponse.json(
      { csrfToken: token },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("GET /api/csrf error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
