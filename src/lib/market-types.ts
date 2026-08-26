export type MarketRange = "1d" | "7d" | "all";

export type MarketSide = "token" | "lp";

export interface RawMarketResponse {
  chain: {
    id: number;
    slug: string;
    name: string;
    shortName: string;
  };
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    imageUrl?: string | null;
  };
  pool: {
    poolId: string;
    quote: {
      address: string;
      symbol: string;
      decimals: number;
      kind: string;
    };
    lpFeePips: number;
  };
  vault: {
    address: string;
    shareSymbol: string;
    shareDecimals: number;
  };
  registeredAt: string;
  metrics: {
    volume24hQuoteRaw: string;
    trades24h: number;
    lastTradedAt: string | null;
    priceChange24hBps: number;
  };
  indexedThroughBlock: string;
}

export interface RawSeriesResponse {
  range: MarketRange;
  points: Array<{
    t: number;
    blockNumber: string;
    price: string | null;
    nav: string | null;
  }>;
  indexedThroughBlock: string;
}

export interface MarketChartPoint {
  t: number;
  fdvUsd: number;
  navUsd: number;
}

export interface MarketSnapshot {
  range: MarketRange;
  source: {
    chain: string;
    chainName: string;
    tokenAddress: string;
    tokenName: string;
    tokenSymbol: string;
    isPreview: boolean;
    indexedThroughBlock: string;
    updatedAt: string;
  };
  metrics: {
    priceUsd: number | null;
    fdvUsd: number | null;
    navUsd: number | null;
    volume24hUsd: number;
    trades24h: number;
    priceChange24hPercent: number;
    feePercent: number;
    totalSupply: number | null;
  };
  series: MarketChartPoint[];
  links: {
    market: string;
    explorer: string;
  };
}
