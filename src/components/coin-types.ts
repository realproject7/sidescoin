import type { MutableRefObject } from "react";
import type { MarketSide } from "@/lib/market-types";

export type CoinPhase = "idle" | "holding" | "landing";

export interface CoinControl {
  mode: CoinPhase;
  targetSide: MarketSide;
  commandId: number;
  turns: number;
  duration: number;
  reducedMotion: boolean;
}

export interface CoinCanvasProps {
  controlRef: MutableRefObject<CoinControl>;
  onSettled: (side: MarketSide) => void;
}
