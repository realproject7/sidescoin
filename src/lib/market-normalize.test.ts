import { describe, expect, it } from "vitest";
import { fixedPointToNumber, normalizeMarketSnapshot } from "./market-normalize";
import type { RawMarketResponse, RawSeriesResponse } from "./market-types";

const market: RawMarketResponse = {
  chain: { id: 8453, slug: "base", name: "Base", shortName: "Base" },
  token: {
    address: "0xb2000000000000000000004c27f6523082f41d01",
    name: "Basecat",
    symbol: "Basecat",
    decimals: 18,
  },
  pool: {
    poolId: "0xpool",
    quote: { address: "0xquote", symbol: "USDC", decimals: 6, kind: "erc20" },
    lpFeePips: 9_000,
  },
  vault: { address: "0xvault", shareSymbol: "lpBasecat", shareDecimals: 18 },
  registeredAt: "2026-08-24T07:12:19.000Z",
  metrics: {
    volume24hQuoteRaw: "2589337021234",
    trades24h: 3_689,
    lastTradedAt: "2026-08-26T02:35:09.000Z",
    priceChange24hBps: -1_157,
  },
  indexedThroughBlock: "50461241",
};

const series: RawSeriesResponse = {
  range: "7d",
  indexedThroughBlock: "50461241",
  points: [
    { t: 1_787_556_573, blockNumber: "1", price: "0.04", nav: "400000" },
    { t: 1_787_558_573, blockNumber: "2", price: "0.05", nav: "420000" },
  ],
};

describe("market normalization", () => {
  it("converts quote raw units without losing the decimal scale", () => {
    expect(fixedPointToNumber("2589337021234", 6)).toBeCloseTo(2_589_337.021234);
  });

  it("builds FDV and NAV chart values from live series semantics", () => {
    const snapshot = normalizeMarketSnapshot({
      market,
      series,
      range: "7d",
      totalSupply: 1_000_000_000,
      quoteUsd: 1,
      marketBaseUrl: "https://lptoken.fun",
    });

    expect(snapshot.series[1].fdvUsd).toBe(50_000_000);
    expect(snapshot.series[1].navUsd).toBe(420_000);
    expect(snapshot.metrics.priceChange24hPercent).toBe(-11.57);
    expect(snapshot.metrics.feePercent).toBe(0.9);
    expect(snapshot.source.isPreview).toBe(true);
  });
});
