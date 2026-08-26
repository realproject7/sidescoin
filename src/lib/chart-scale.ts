export interface ComparisonReturnDomain {
  min: number;
  max: number;
}

export interface DollarAxis {
  baseline: number;
  domain: ComparisonReturnDomain;
}

/**
 * Build one return-multiple domain for absolute-value series with different units.
 * Each series is indexed to its own first observation before the domains are merged.
 */
export function comparisonReturnDomain(
  series: readonly (readonly number[])[],
): ComparisonReturnDomain | null {
  const multiples = series.flatMap((values) => {
    const baseline = values[0];
    if (values.length < 2 || !Number.isFinite(baseline) || baseline <= 0) {
      return [];
    }

    return values.flatMap((value) =>
      Number.isFinite(value) && value > 0 ? [value / baseline] : [],
    );
  });

  if (multiples.length < 2) return null;

  const low = Math.min(...multiples);
  const high = Math.max(...multiples);
  const spread = high - low;
  const padding = spread > 0 ? spread * 0.1 : 0.02;
  const min = Math.max(0, low - padding);
  const max = high + padding;

  return Number.isFinite(max - min) && max > min ? { min, max } : null;
}

export function createDollarAxis(
  values: readonly number[],
  domain: ComparisonReturnDomain,
): DollarAxis | null {
  const baseline = values[0];
  if (
    values.length < 2
    || !Number.isFinite(baseline)
    || baseline <= 0
    || !Number.isFinite(domain.max - domain.min)
    || domain.max <= domain.min
  ) {
    return null;
  }

  return { baseline, domain };
}

/** Zero is the top of the plot and one is the bottom. */
export function plotRatioFor(value: number, axis: DollarAxis): number {
  const domainSize = axis.domain.max - axis.domain.min;
  return (axis.domain.max - value / axis.baseline) / domainSize;
}

export function dollarValueAt(plotRatio: number, axis: DollarAxis): number {
  const domainSize = axis.domain.max - axis.domain.min;
  return axis.baseline * (axis.domain.max - plotRatio * domainSize);
}
