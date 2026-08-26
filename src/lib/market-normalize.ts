import type {
  MarketChartPoint,
  MarketRange,
  MarketSnapshot,
  RawMarketResponse,
  RawSeriesResponse,
} from "./market-types";

export const BASECAT_PREVIEW_ADDRESS =
  "0xb2000000000000000000004c27f6523082f41d01";

export function fixedPointToNumber(raw: string, decimals: number): number {
  if (!/^\d+$/.test(raw) || !Number.isInteger(decimals) || decimals < 0) {
    throw new Error("Invalid fixed-point value");
  }

  return Number(BigInt(raw)) / 10 ** decimals;
}

export function normalizeMarketSnapshot(input: {
  market: RawMarketResponse;
  series: RawSeriesResponse;
  range: MarketRange;
  totalSupply: number | null;
  quoteUsd: number;
  marketBaseUrl: string;
}): MarketSnapshot {
  const { market, series, range, totalSupply, quoteUsd, marketBaseUrl } = input;
  const chart: MarketChartPoint[] = series.points.flatMap((point) => {
    if (typeof point.price !== "string" || typeof point.nav !== "string") {
      return [];
    }
    const priceQuote = Number(point.price);
    const navQuote = Number(point.nav);

    if (!Number.isFinite(priceQuote) || !Number.isFinite(navQuote)) {
      return [];
    }

    return [
      {
        t: point.t,
        fdvUsd: totalSupply === null ? 0 : priceQuote * quoteUsd * totalSupply,
        navUsd: navQuote * quoteUsd,
      },
    ];
  });

  const latestPricePoint = series.points.findLast(
    (point) => typeof point.price === "string" && Number.isFinite(Number(point.price)),
  );
  const latestNavPoint = series.points.findLast(
    (point) => typeof point.nav === "string" && Number.isFinite(Number(point.nav)),
  );
  const priceUsd = latestPricePoint?.price
    ? Number(latestPricePoint.price) * quoteUsd
    : null;
  const navUsd = latestNavPoint?.nav
    ? Number(latestNavPoint.nav) * quoteUsd
    : null;
  const address = market.token.address.toLowerCase();
  const baseUrl = marketBaseUrl.replace(/\/$/, "");

  return {
    range,
    source: {
      chain: market.chain.slug,
      chainName: market.chain.name,
      tokenAddress: market.token.address,
      tokenName: market.token.name,
      tokenSymbol: market.token.symbol,
      vaultAddress: market.vault.address,
      poolId: market.pool.poolId,
      quoteSymbol: market.pool.quote.symbol,
      isPreview: address === BASECAT_PREVIEW_ADDRESS,
      indexedThroughBlock: series.indexedThroughBlock,
      updatedAt: new Date(
        (latestPricePoint?.t ?? Date.now() / 1000) * 1000,
      ).toISOString(),
    },
    metrics: {
      priceUsd: Number.isFinite(priceUsd) ? priceUsd : null,
      fdvUsd:
        totalSupply === null || priceUsd === null
          ? null
          : priceUsd * totalSupply,
      navUsd,
      volume24hUsd:
        fixedPointToNumber(
          market.metrics.volume24hQuoteRaw,
          market.pool.quote.decimals,
        ) * quoteUsd,
      trades24h: market.metrics.trades24h,
      priceChange24hPercent: market.metrics.priceChange24hBps / 100,
      feePercent: market.pool.lpFeePips / 10_000,
      totalSupply,
    },
    series: chart,
    links: {
      market: `${baseUrl}/trade/${market.chain.slug}/${market.token.address}`,
      explorer:
        market.chain.slug === "base"
          ? `https://basescan.org/token/${market.token.address}`
          : `${baseUrl}/trade/${market.chain.slug}/${market.token.address}`,
      dexscreener: `https://dexscreener.com/${market.chain.slug}/${market.token.address}`,
    },
  };
}
