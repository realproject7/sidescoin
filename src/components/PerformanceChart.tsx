"use client";

import { useMemo, useState } from "react";
import {
  comparisonReturnDomain,
  createDollarAxis,
  dollarValueAt,
  plotRatioFor,
  type DollarAxis,
} from "@/lib/chart-scale";
import { formatChartTime, formatUsd } from "@/lib/format";
import type { MarketChartPoint, MarketRange, MarketSide } from "@/lib/market-types";

const WIDTH = 940;
const HEIGHT = 350;
const PADDING = { top: 34, right: 80, bottom: 42, left: 76 };

interface PerformanceChartProps {
  points: MarketChartPoint[];
  range: MarketRange;
  side: MarketSide;
  loading: boolean;
  onRangeChange: (range: MarketRange) => void;
}

function pathFor(points: MarketChartPoint[], key: "fdvUsd" | "navUsd", axis: DollarAxis) {
  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;
  return points.map((point, index) => {
    const x = PADDING.left + (index / Math.max(points.length - 1, 1)) * chartWidth;
    const y = PADDING.top + plotRatioFor(point[key], axis) * chartHeight;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

export function PerformanceChart({ points, range, side, loading, onRangeChange }: PerformanceChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chart = useMemo(() => {
    if (points.length === 0) return null;
    const fdvValues = points.map((point) => point.fdvUsd);
    const navValues = points.map((point) => point.navUsd);
    const domain = comparisonReturnDomain([fdvValues, navValues]);
    if (!domain) return null;

    const fdvAxis = createDollarAxis(fdvValues, domain);
    const navAxis = createDollarAxis(navValues, domain);
    if (!fdvAxis || !navAxis) return null;

    return {
      domain,
      fdvAxis,
      navAxis,
      fdvPath: pathFor(points, "fdvUsd", fdvAxis),
      navPath: pathFor(points, "navUsd", navAxis),
    };
  }, [points]);

  const hovered = hoveredIndex === null ? null : points[hoveredIndex];
  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const hoverX = hoveredIndex === null ? 0 : PADDING.left + (hoveredIndex / Math.max(points.length - 1, 1)) * chartWidth;

  return (
    <div className="chart-shell">
      <div className="chart-toolbar">
        <div>
          <p className="mono-label">MARKET PERFORMANCE</p>
          <h3>SIDES FDV <span>/</span> lpSIDES NAV</h3>
        </div>
        <div className="range-selector" aria-label="Chart range">
          {(["1d", "7d", "all"] as const).map((value) => (
            <button key={value} type="button" className={range === value ? "is-active" : ""} onClick={() => onRangeChange(value)} disabled={loading}>
              {value === "1d" ? "24H" : value.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {chart ? (
        <div className="chart-stage">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label="SIDES fully diluted value compared with lpSIDES net asset value"
            onPointerMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
              const relative = (x - PADDING.left) / chartWidth;
              const index = Math.round(relative * (points.length - 1));
              setHoveredIndex(Math.max(0, Math.min(points.length - 1, index)));
            }}
            onPointerLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="token-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#79a4ff" /><stop offset="1" stopColor="#0052ff" /></linearGradient>
              <linearGradient id="lp-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#a8fff0" /><stop offset="1" stopColor="#35d9bd" /></linearGradient>
              <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = PADDING.top + ratio * (HEIGHT - PADDING.top - PADDING.bottom);
              const fdvValue = dollarValueAt(ratio, chart.fdvAxis);
              const navValue = dollarValueAt(ratio, chart.navAxis);
              return (
                <g key={ratio}>
                  <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} className="chart-grid" />
                  <text x={PADDING.left - 12} y={y + 4} textAnchor="end" className="chart-axis chart-axis--token">{formatUsd(fdvValue, true)}</text>
                  <text x={WIDTH - PADDING.right + 12} y={y + 4} className="chart-axis chart-axis--lp">{formatUsd(navValue, true)}</text>
                </g>
              );
            })}

            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={PADDING.top + plotRatioFor(chart.fdvAxis.baseline, chart.fdvAxis) * (HEIGHT - PADDING.top - PADDING.bottom)}
              y2={PADDING.top + plotRatioFor(chart.fdvAxis.baseline, chart.fdvAxis) * (HEIGHT - PADDING.top - PADDING.bottom)}
              className="chart-baseline"
            />

            <text x={PADDING.left} y={17} className="chart-caption chart-caption--token">FDV</text>
            <text x={WIDTH - PADDING.right} y={17} textAnchor="end" className="chart-caption chart-caption--lp">NAV / SHARE</text>
            <path d={chart.fdvPath} className={`chart-line chart-line--token ${side === "token" ? "is-selected" : ""}`} filter={side === "token" ? "url(#line-glow)" : undefined} />
            <path d={chart.navPath} className={`chart-line chart-line--lp ${side === "lp" ? "is-selected" : ""}`} filter={side === "lp" ? "url(#line-glow)" : undefined} />

            {hovered && (
              <g>
                <line x1={hoverX} x2={hoverX} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className="chart-cursor" />
                <circle cx={hoverX} cy={PADDING.top + plotRatioFor(hovered.fdvUsd, chart.fdvAxis) * (HEIGHT - PADDING.top - PADDING.bottom)} r="5" className="chart-dot chart-dot--token" />
                <circle cx={hoverX} cy={PADDING.top + plotRatioFor(hovered.navUsd, chart.navAxis) * (HEIGHT - PADDING.top - PADDING.bottom)} r="5" className="chart-dot chart-dot--lp" />
              </g>
            )}

            {points.length > 1 && [0, 0.5, 1].map((ratio) => {
              const point = points[Math.round(ratio * (points.length - 1))];
              return <text key={ratio} x={PADDING.left + ratio * chartWidth} y={HEIGHT - 12} textAnchor={ratio === 0 ? "start" : ratio === 1 ? "end" : "middle"} className="chart-time">{formatChartTime(point.t, range)}</text>;
            })}
          </svg>

          {hovered && (
            <div className="chart-tooltip" style={{ left: `${(hoverX / WIDTH) * 100}%` }}>
              <span>{formatChartTime(hovered.t, range)}</span>
              <strong className="token-color">SIDES {formatUsd(hovered.fdvUsd, true)}</strong>
              <strong className="lp-color">lpSIDES {formatUsd(hovered.navUsd, true)}</strong>
            </div>
          )}
        </div>
      ) : <div className="chart-empty">Waiting for live Base market history.</div>}
    </div>
  );
}
