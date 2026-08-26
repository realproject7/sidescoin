import { unstable_cache } from "next/cache";
import type {
  MarketRange,
  MarketSnapshot,
  RawMarketResponse,
  RawSeriesResponse,
} from "./market-types";
import { normalizeMarketSnapshot } from "./market-normalize";
import { SIDES_CONTRACT } from "./sides";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const STABLE_QUOTES = new Set(["USDC", "USDT", "USDS", "USDG", "DAI"]);

function getConfig() {
  const baseUrl = process.env.LPTOKEN_BASE_URL ?? "https://lptoken.fun";
  const chain = process.env.LPTOKEN_CHAIN ?? "base";
  const tokenAddress =
    process.env.LPTOKEN_TOKEN_ADDRESS ?? SIDES_CONTRACT;
  const rpcUrl = process.env.BASE_RPC_URL ?? "https://mainnet.base.org";

  if (!ADDRESS_PATTERN.test(tokenAddress)) {
    throw new Error("LPTOKEN_TOKEN_ADDRESS must be a valid EVM address");
  }

  const parsedBaseUrl = new URL(baseUrl);
  const parsedRpcUrl = new URL(rpcUrl);
  if (parsedBaseUrl.protocol !== "https:" || parsedRpcUrl.protocol !== "https:") {
    throw new Error("Market and RPC origins must use HTTPS");
  }

  return {
    baseUrl: parsedBaseUrl.origin,
    chain,
    tokenAddress,
    rpcUrl: parsedRpcUrl.toString(),
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(6_000),
  });

  if (!response.ok) {
    throw new Error(`Upstream request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function readTotalSupply(
  rpcUrl: string,
  tokenAddress: string,
  decimals: number,
): Promise<number | null> {
  try {
    const response = await fetchJson<{
      result?: string;
      error?: { message?: string };
    }>(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: tokenAddress, data: "0x18160ddd" }, "latest"],
      }),
    });

    if (!response.result || response.result === "0x") {
      return null;
    }

    return Number(BigInt(response.result)) / 10 ** decimals;
  } catch {
    return null;
  }
}

async function readEthUsd(): Promise<number> {
  const response = await fetchJson<{ price: string }>(
    "https://data-api.binance.vision/api/v3/ticker/price?symbol=ETHUSDT",
  );
  const price = Number(response.price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("ETH/USD price is unavailable");
  }
  return price;
}

async function readDexImpliedSupply(
  chain: string,
  tokenAddress: string,
): Promise<number | null> {
  try {
    const pairs = await fetchJson<Array<{
      priceUsd?: string;
      fdv?: number;
      liquidity?: { usd?: number };
    }>>(
      `https://api.dexscreener.com/token-pairs/v1/${encodeURIComponent(chain)}/${encodeURIComponent(tokenAddress)}`,
    );
    const pair = pairs
      .filter((candidate) => Number(candidate.liquidity?.usd) > 0)
      .sort((a, b) => Number(b.liquidity?.usd) - Number(a.liquidity?.usd))[0];
    const priceUsd = Number(pair?.priceUsd);
    const fdv = Number(pair?.fdv);
    return Number.isFinite(priceUsd) && priceUsd > 0 && Number.isFinite(fdv) && fdv > 0
      ? fdv / priceUsd
      : null;
  } catch {
    return null;
  }
}

async function getQuoteUsd(symbol: string): Promise<number> {
  if (STABLE_QUOTES.has(symbol.toUpperCase())) {
    return 1;
  }

  if (["ETH", "WETH"].includes(symbol.toUpperCase())) {
    return readEthUsd();
  }

  throw new Error(`Unsupported quote currency: ${symbol}`);
}

function requireSupply(candidate: Promise<number | null>): Promise<number> {
  return candidate.then((value) => {
    if (value === null || !Number.isFinite(value) || value <= 0) {
      throw new Error("Token supply source returned no usable value");
    }
    return value;
  });
}

async function loadMarketSnapshot(
  range: MarketRange,
): Promise<MarketSnapshot> {
  const config = getConfig();
  const encodedChain = encodeURIComponent(config.chain);
  const encodedAddress = encodeURIComponent(config.tokenAddress);
  const marketUrl = `${config.baseUrl}/api/markets/${encodedChain}/${encodedAddress}`;
  const seriesUrl = `${marketUrl}/series?range=${range}`;

  const marketPromise = fetchJson<RawMarketResponse>(marketUrl);
  const seriesPromise = fetchJson<RawSeriesResponse>(seriesUrl);
  const market = await marketPromise;
  const supplyPromise = Promise.any([
    requireSupply(readTotalSupply(config.rpcUrl, market.token.address, market.token.decimals)),
    requireSupply(readDexImpliedSupply(market.chain.slug, market.token.address)),
  ]).catch(() => null);
  const [series, totalSupply, quoteUsd] = await Promise.all([
    seriesPromise,
    supplyPromise,
    getQuoteUsd(market.pool.quote.symbol),
  ]);

  return normalizeMarketSnapshot({
    market,
    series,
    range,
    totalSupply,
    quoteUsd,
    marketBaseUrl: config.baseUrl,
  });
}

const getCachedMarketSnapshot = unstable_cache(
  loadMarketSnapshot,
  ["sides-market-snapshot-v3"],
  { revalidate: 45 },
);

export async function getMarketSnapshot(range: MarketRange): Promise<MarketSnapshot> {
  return getCachedMarketSnapshot(range);
}
