import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HOLD_THRESHOLD_MS } from "@/lib/market-side";
import { CoinHero } from "./CoinHero";

vi.mock("next/dynamic", () => ({
  default: () => function MockCoinCanvas() {
    return <div data-testid="coin-canvas" />;
  },
}));

vi.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => false }));

class MockPointerEvent extends MouseEvent {
  isPrimary: boolean;
  pointerId: number;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.isPrimary = init.isPrimary ?? true;
    this.pointerId = init.pointerId ?? 1;
  }
}

describe("CoinHero gestures", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("PointerEvent", MockPointerEvent);
    Object.defineProperties(HTMLElement.prototype, {
      hasPointerCapture: { configurable: true, value: vi.fn(() => true) },
      releasePointerCapture: { configurable: true, value: vi.fn() },
      setPointerCapture: { configurable: true, value: vi.fn() },
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("treats a short pointer gesture as one deterministic flip", () => {
    const onPhaseChange = vi.fn();
    render(<CoinHero side="token" onPhaseChange={onPhaseChange} onSettled={vi.fn()} />);
    const button = screen.getByRole("button");

    fireEvent.pointerDown(button, { pointerId: 7, isPrimary: true, button: 0 });
    vi.advanceTimersByTime(HOLD_THRESHOLD_MS - 1);
    fireEvent.pointerUp(button, { pointerId: 7, isPrimary: true, button: 0 });
    fireEvent.click(button);

    expect(onPhaseChange.mock.calls).toEqual([["landing"]]);
  });

  it("spins after the hold threshold and suppresses the following click", () => {
    const onPhaseChange = vi.fn();
    render(<CoinHero side="token" onPhaseChange={onPhaseChange} onSettled={vi.fn()} />);
    const button = screen.getByRole("button");

    fireEvent.pointerDown(button, { pointerId: 9, isPrimary: true, button: 0 });
    vi.advanceTimersByTime(HOLD_THRESHOLD_MS);
    expect(onPhaseChange.mock.calls).toEqual([["holding"]]);

    fireEvent.pointerUp(button, { pointerId: 9, isPrimary: true, button: 0 });
    fireEvent.click(button);

    expect(onPhaseChange.mock.calls).toEqual([["holding"], ["landing"]]);
  });

  it("lands exactly once when a held pointer is cancelled", () => {
    const onPhaseChange = vi.fn();
    render(<CoinHero side="lp" onPhaseChange={onPhaseChange} onSettled={vi.fn()} />);
    const button = screen.getByRole("button");

    fireEvent.pointerDown(button, { pointerId: 11, isPrimary: true, button: 0 });
    vi.advanceTimersByTime(HOLD_THRESHOLD_MS);
    fireEvent.pointerCancel(button, { pointerId: 11, isPrimary: true, button: 0 });
    fireEvent.click(button);

    expect(onPhaseChange.mock.calls).toEqual([["holding"], ["landing"]]);
  });
});
