"use client";

import { formatNumber, formatPercent, formatUsd } from "@/lib/format";
import type { MarketRange, MarketSide, MarketSnapshot } from "@/lib/market-types";
import type { CoinPhase } from "./coin-types";
import { PerformanceChart } from "./PerformanceChart";

interface MarketPanelProps {
  snapshot: MarketSnapshot | null;
  side: MarketSide;
  phase: CoinPhase;
  loading: boolean;
  range: MarketRange;
  error: string | null;
  onRangeChange: (range: MarketRange) => void;
  onSelectSide: (side: MarketSide) => void;
  onRetry: () => void;
}

export function MarketPanel({ snapshot, side, phase, loading, range, error, onRangeChange, onSelectSide, onRetry }: MarketPanelProps) {
  const metrics = snapshot?.metrics;
  const isFlipping = phase !== "idle";
  const primaryValue = side === "token" ? metrics?.priceUsd ?? null : metrics?.navUsd ?? null;
  const primaryLabel = side === "token" ? "TOKEN PRICE" : "NAV / LP SHARE";

  return (
    <section className="market-section" id="market" aria-labelledby="market-title">
      <div className="market-section__inner">
        <div className="market-intro">
          <div><p className="mono-label">CHOOSE YOUR EXPOSURE</p><h2 id="market-title">One market. Two ways in.</h2></div>
          {snapshot && (
            <div className="source-status"><span className="source-status__pulse" />{snapshot.source.isPreview ? `LIVE BASE PREVIEW · ${snapshot.source.tokenSymbol.toUpperCase()}` : `LIVE ON ${snapshot.source.chainName.toUpperCase()}`}</div>
          )}
        </div>

        <div className="side-selector" role="tablist" aria-label="Choose market side">
          <button type="button" role="tab" aria-selected={side === "token"} className={side === "token" ? "is-active is-token" : "is-token"} disabled={isFlipping} onClick={() => onSelectSide("token")}>
            <span className="side-selector__symbol">SIDES</span><span>PRICE · BUY AND SELL THE TOKEN</span>
          </button>
          <button type="button" role="tab" aria-selected={side === "lp"} className={side === "lp" ? "is-active is-lp" : "is-lp"} disabled={isFlipping} onClick={() => onSelectSide("lp")}>
            <span className="side-selector__symbol">lp&#123;SIDES&#125;</span><span>LIQUIDITY · MINT AND REDEEM THE LP SHARE</span>
          </button>
        </div>

        {error && !snapshot ? (
          <div className="market-error" role="alert">
            <p className="mono-label">DATA CONNECTION PAUSED</p><h3>The Base market did not answer in time.</h3><p>The coin still works. Retry the read-only market feed when ready.</p>
            <button type="button" onClick={onRetry}>RETRY LIVE DATA</button>
          </div>
        ) : (
          <div className={`market-board market-board--${side}`}>
            <div className="market-summary">
              <div className="market-primary">
                <p className="mono-label">{primaryLabel}</p><strong>{formatUsd(primaryValue, side === "lp")}</strong>
                <span className={metrics && metrics.priceChange24hPercent >= 0 ? "positive" : "negative"}>{metrics ? `${formatPercent(metrics.priceChange24hPercent)} · 24H` : "LOADING LIVE MARKET"}</span>
              </div>
              <div className="market-metrics">
                <div><span>FDV</span><strong>{formatUsd(metrics?.fdvUsd ?? null, true)}</strong></div>
                <div><span>24H VOLUME</span><strong>{formatUsd(metrics?.volume24hUsd ?? null, true)}</strong></div>
                <div><span>TRADES</span><strong>{metrics ? formatNumber(metrics.trades24h, true) : "—"}</strong></div>
                <div><span>POOL FEE</span><strong>{metrics ? `${metrics.feePercent.toFixed(2)}%` : "—"}</strong></div>
              </div>
              <a className={`market-cta market-cta--${side}`} href={snapshot?.links.market ?? "https://lptoken.fun"} target="_blank" rel="noreferrer">
                {side === "token" ? "BUY SIDES" : "MINT lpSIDES"}<span aria-hidden="true">↗</span>
              </a>
            </div>

            <PerformanceChart points={snapshot?.series ?? []} range={range} side={side} loading={loading} onRangeChange={onRangeChange} />

            <div className="market-footer">
              <div className="market-legend"><span><i className="legend-line legend-line--token" /> SIDES · FDV</span><span><i className="legend-line legend-line--lp" /> lpSIDES · NAV / SHARE</span></div>
              <div className="market-links"><a href={snapshot?.links.explorer ?? "https://basescan.org"} target="_blank" rel="noreferrer">BASESCAN ↗</a><a href={snapshot?.links.market ?? "https://lptoken.fun"} target="_blank" rel="noreferrer">LPTOKEN.FUN ↗</a></div>
            </div>

            {isFlipping && (
              <div className="market-flip-overlay" aria-live="polite">
                <div className="flip-loader"><div className="flip-loader__coin"><span /></div><div><p className="mono-label">{phase === "holding" ? "BUILDING MOMENTUM" : "COIN IN FLIGHT"}</p><strong>{phase === "holding" ? "Release to choose a side." : "Finding the face…"}</strong></div></div>
                <div className="flip-progress"><span /></div>
              </div>
            )}
          </div>
        )}

        <div className="market-note"><span>READ-ONLY MARKET VIEW</span><p>Market execution opens on lptoken.fun. No wallet connects to this site.</p></div>
      </div>
    </section>
  );
}
