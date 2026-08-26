"use client";

import dynamic from "next/dynamic";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  HOLD_THRESHOLD_MS,
  marketSideFromRandomValue,
  oppositeMarketSide,
} from "@/lib/market-side";
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
    const activePointerRef = useRef<number | null>(null);
    const holdTimerRef = useRef<number | null>(null);
    const heldRef = useRef(false);
    const suppressClickRef = useRef(false);
    const controlRef = useRef<CoinControl>({
      mode: "idle",
      targetSide: "token",
      commandId: 0,
      turns: 4,
      duration: 1.65,
      reducedMotion,
    });

    controlRef.current.reducedMotion = reducedMotion;

    const clearHoldTimer = useCallback(() => {
      if (holdTimerRef.current !== null) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    }, []);

    useEffect(() => clearHoldTimer, [clearHoldTimer]);

    const pickRandomSide = useCallback(() => {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return marketSideFromRandomValue(values[0] / 2 ** 32);
    }, []);

    const beginLanding = useCallback(
      (nextSide: MarketSide) => {
        const control = controlRef.current;
        if (control.mode === "landing") return;

        const wasHolding = control.mode === "holding";
        control.mode = "landing";
        control.targetSide = nextSide;
        control.turns = reducedMotion ? 0 : wasHolding ? 2 : 3;
        control.duration = reducedMotion ? 0.28 : wasHolding ? 0.82 : 1.05;
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

    const suppressSyntheticClick = useCallback(() => {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }, []);

    const finishPointerGesture = useCallback(
      (pointerId: number, cancelled = false) => {
        if (activePointerRef.current !== pointerId) return;

        clearHoldTimer();
        activePointerRef.current = null;

        if (heldRef.current) {
          heldRef.current = false;
          suppressSyntheticClick();
          beginLanding(pickRandomSide());
        } else if (cancelled) {
          heldRef.current = false;
        }
      },
      [beginLanding, clearHoldTimer, pickRandomSide, suppressSyntheticClick],
    );

    return (
      <button
        type="button"
        className="coin-interaction"
        aria-label={`Tap to flip to the ${side === "token" ? "lpSIDES volume" : "SIDES price"} side. Hold to spin and pick a random side.`}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0 || controlRef.current.mode !== "idle") return;

          event.currentTarget.setPointerCapture(event.pointerId);
          activePointerRef.current = event.pointerId;
          heldRef.current = false;
          suppressClickRef.current = false;
          holdTimerRef.current = window.setTimeout(() => {
            if (activePointerRef.current !== event.pointerId || controlRef.current.mode !== "idle") return;
            heldRef.current = true;
            controlRef.current.mode = "holding";
            onPhaseChange("holding");
          }, HOLD_THRESHOLD_MS);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          finishPointerGesture(event.pointerId);
        }}
        onPointerCancel={(event) => finishPointerGesture(event.pointerId, true)}
        onContextMenu={(event) => event.preventDefault()}
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          if (controlRef.current.mode === "idle") {
            beginLanding(oppositeMarketSide(side));
          }
        }}
      >
        <CoinCanvas controlRef={controlRef} onSettled={handleSettled} />
        <span className="coin-interaction__orbit" aria-hidden="true" />
      </button>
    );
  },
);
