import type { MarketSide } from "./market-types";

export function oppositeMarketSide(side: MarketSide): MarketSide {
  return side === "token" ? "lp" : "token";
}
