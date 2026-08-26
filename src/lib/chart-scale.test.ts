import { describe, expect, it } from "vitest";
import {
  comparisonReturnDomain,
  createDollarAxis,
  dollarValueAt,
  plotRatioFor,
} from "./chart-scale";

describe("comparison chart scale", () => {
  it("preserves divergent relative performance across different dollar units", () => {
    const fdv = [38_000_000, 25_000_000];
    const nav = [375_000, 327_254];
    const domain = comparisonReturnDomain([fdv, nav]);

    expect(domain).not.toBeNull();

    const fdvAxis = createDollarAxis(fdv, domain!);
    const navAxis = createDollarAxis(nav, domain!);
    expect(fdvAxis).not.toBeNull();
    expect(navAxis).not.toBeNull();

    const fdvEnd = plotRatioFor(fdv[1], fdvAxis!);
    const navEnd = plotRatioFor(nav[1], navAxis!);

    expect(fdvEnd - navEnd).toBeGreaterThan(0.4);
    expect(dollarValueAt(0.5, fdvAxis!)).toBeCloseTo(
      fdvAxis!.baseline * (domain!.max - 0.5 * (domain!.max - domain!.min)),
    );
    expect(dollarValueAt(0.5, navAxis!)).toBeCloseTo(
      navAxis!.baseline * (domain!.max - 0.5 * (domain!.max - domain!.min)),
    );
  });

  it("pads a flat shared return domain", () => {
    expect(comparisonReturnDomain([[100, 100], [10, 10]])).toEqual({
      min: 0.98,
      max: 1.02,
    });
  });

  it("rejects series without a positive baseline", () => {
    expect(comparisonReturnDomain([[0, 1], [Number.NaN, 2]])).toBeNull();
  });
});
