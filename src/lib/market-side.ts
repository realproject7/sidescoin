import type { MarketSide } from "./market-types";

export const HOLD_THRESHOLD_MS = 320;

export function oppositeMarketSide(side: MarketSide): MarketSide {
  return side === "token" ? "lp" : "token";
}

export function marketSideFromRandomValue(value: number): MarketSide {
  return value < 0.5 ? "token" : "lp";
}
