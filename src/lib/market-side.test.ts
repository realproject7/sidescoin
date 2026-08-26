import { describe, expect, it } from "vitest";
import { oppositeMarketSide } from "./market-side";

describe("market side controls", () => {
  it("toggles deterministically between token and LP exposure", () => {
    expect(oppositeMarketSide("token")).toBe("lp");
    expect(oppositeMarketSide("lp")).toBe("token");
  });
});
