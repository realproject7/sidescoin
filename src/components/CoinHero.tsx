"use client";

import dynamic from "next/dynamic";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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
  onPhaseChange: (phase: CoinPhase) => void;
  onSettled: (side: MarketSide) => void;
}

export const CoinHero = forwardRef<CoinHeroHandle, CoinHeroProps>(
  function CoinHero({ onPhaseChange, onSettled }, ref) {
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
      (side: MarketSide, direct = false) => {
        const control = controlRef.current;
        if (control.mode === "landing") return;

        control.mode = "landing";
        control.targetSide = side;
        control.turns = reducedMotion ? 0 : direct ? 3 : 4 + Math.floor(Math.random() * 2);
        control.duration = reducedMotion ? 0.36 : direct ? 1.25 : 1.65;
        control.commandId += 1;
        onPhaseChange("landing");
      },
      [onPhaseChange, reducedMotion],
    );

    const startHolding = useCallback(() => {
      const control = controlRef.current;
      if (control.mode !== "idle") return;
      control.mode = "holding";
      onPhaseChange("holding");
    }, [onPhaseChange]);

    const release = useCallback(() => {
      if (controlRef.current.mode !== "holding") return;
      beginLanding(Math.random() < 0.5 ? "token" : "lp");
    }, [beginLanding]);

    useImperativeHandle(
      ref,
      () => ({
        flipTo(side) {
          if (controlRef.current.mode === "idle") beginLanding(side, true);
        },
      }),
      [beginLanding],
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
        aria-label="Hold to spin the SIDES coin, then release to choose a side"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          startHolding();
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          release();
        }}
        onPointerCancel={release}
        onKeyDown={(event) => {
          if ((event.key === " " || event.key === "Enter") && !event.repeat) {
            event.preventDefault();
            startHolding();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            release();
          }
        }}
      >
        <CoinCanvas controlRef={controlRef} onSettled={handleSettled} />
        <span className="coin-interaction__orbit" aria-hidden="true" />
      </button>
    );
  },
);
