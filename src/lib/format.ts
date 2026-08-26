export function formatUsd(value: number | null, compact = false): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: value >= 1_000_000 ? 2 : 1,
    }).format(value);
  }
  const decimals = value >= 1 ? 4 : value >= 0.01 ? 5 : 7;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatNumber(value: number, compact = false): string {
  return new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 2 : 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatChartTime(timestamp: number, range: string): string {
  const date = new Date(timestamp * 1000);
  return new Intl.DateTimeFormat("en-US", {
    month: range === "1d" ? undefined : "short",
    day: range === "1d" ? undefined : "numeric",
    hour: range === "1d" ? "numeric" : undefined,
    minute: range === "1d" ? "2-digit" : undefined,
  }).format(date);
}
