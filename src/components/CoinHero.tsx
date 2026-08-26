"use client";

import dynamic from "next/dynamic";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { oppositeMarketSide } from "@/lib/market-side";
import type { MarketSide } from "@/lib/market-types";
import type { CoinControl, CoinPhase } from "./coin-types";

const CoinCanvas = dynamic(() => import("./CoinCanvas"), {
  ssr: false,
  loading: () => <div className="coin-canvas-fallback" aria-hidden="true" />,
});

export interface CoinHeroHandle {
  flipTo: (side: MarketSide) => void;
}

interface CoinHeroProps {
  side: MarketSide;
  onPhaseChange: (phase: CoinPhase) => void;
  onSettled: (side: MarketSide) => void;
}

export const CoinHero = forwardRef<CoinHeroHandle, CoinHeroProps>(
  function CoinHero({ side, onPhaseChange, onSettled }, ref) {
    const reducedMotion = useReducedMotion();
    const controlRef = useRef<CoinControl>({
      mode: "idle",
      targetSide: "token",
      commandId: 0,
      turns: 4,
      duration: 1.65,
      reducedMotion,
    });

    controlRef.current.reducedMotion = reducedMotion;

    const beginLanding = useCallback(
      (nextSide: MarketSide) => {
        const control = controlRef.current;
        if (control.mode === "landing") return;

        control.mode = "landing";
        control.targetSide = nextSide;
        control.turns = reducedMotion ? 0 : 3;
        control.duration = reducedMotion ? 0.28 : 1.05;
        control.commandId += 1;
        onPhaseChange("landing");
      },
      [onPhaseChange, reducedMotion],
    );

    useImperativeHandle(
      ref,
      () => ({
        flipTo(nextSide) {
          if (controlRef.current.mode === "idle" && nextSide !== side) {
            beginLanding(nextSide);
          }
        },
      }),
      [beginLanding, side],
    );

    const handleSettled = useCallback(
      (side: MarketSide) => {
        onPhaseChange("idle");
        onSettled(side);
      },
      [onPhaseChange, onSettled],
    );

    return (
      <button
        type="button"
        className="coin-interaction"
        aria-label={`Flip the SIDES coin to the ${side === "token" ? "lpSIDES volume" : "SIDES price"} side`}
        onClick={() => beginLanding(oppositeMarketSide(side))}
      >
        <CoinCanvas controlRef={controlRef} onSettled={handleSettled} />
        <span className="coin-interaction__orbit" aria-hidden="true" />
      </button>
    );
  },
);
