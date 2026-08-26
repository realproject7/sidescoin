import { describe, expect, it } from "vitest";
import {
  HOLD_THRESHOLD_MS,
  marketSideFromRandomValue,
  oppositeMarketSide,
} from "./market-side";

describe("market side controls", () => {
  it("toggles deterministically between token and LP exposure", () => {
    expect(oppositeMarketSide("token")).toBe("lp");
    expect(oppositeMarketSide("lp")).toBe("token");
  });

  it("keeps the hold threshold long enough to distinguish a tap", () => {
    expect(HOLD_THRESHOLD_MS).toBe(320);
  });

  it("maps either half of a random value to one market side", () => {
    expect(marketSideFromRandomValue(0)).toBe("token");
    expect(marketSideFromRandomValue(0.4999)).toBe("token");
    expect(marketSideFromRandomValue(0.5)).toBe("lp");
    expect(marketSideFromRandomValue(0.9999)).toBe("lp");
  });
});
