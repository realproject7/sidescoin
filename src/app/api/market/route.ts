import { NextRequest } from "next/server";
import { getMarketSnapshot } from "@/lib/market-server";
import type { MarketRange } from "@/lib/market-types";

export const dynamic = "force-dynamic";

const VALID_RANGES = new Set<MarketRange>(["1d", "7d", "all"]);

export async function GET(request: NextRequest) {
  const requestedRange = request.nextUrl.searchParams.get("range") ?? "7d";
  const range = VALID_RANGES.has(requestedRange as MarketRange)
    ? (requestedRange as MarketRange)
    : "7d";

  try {
    const snapshot = await getMarketSnapshot(range);
    return Response.json(snapshot, {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=180",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown market error";
    return Response.json(
      { error: "Market data is temporarily unavailable", detail: message },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
