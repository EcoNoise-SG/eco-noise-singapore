import { NextResponse } from "next/server";
import { getGovernmentDomainIntel } from "@/lib/datagovsg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const intel = await getGovernmentDomainIntel();
    return NextResponse.json(intel, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load government domain intelligence",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
