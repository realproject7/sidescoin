"use client";

import { useState } from "react";
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
  const [copied, setCopied] = useState(false);
  const metrics = snapshot?.metrics;
  const isFlipping = phase !== "idle";
  const isHolding = phase === "holding";
  const primaryValue = side === "token" ? metrics?.priceUsd ?? null : metrics?.navUsd ?? null;
  const primaryLabel = side === "token" ? "TOKEN PRICE" : "NAV / LP SHARE";
  const copyContract = async () => {
    if (!snapshot) return;
    try {
      await navigator.clipboard.writeText(snapshot.source.tokenAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="market-section" id="market" aria-labelledby="market-title">
      <div className="market-section__inner">
        <div className="market-intro">
          <div><p className="mono-label">LIVE FROM THE JANUS MARKET</p><h2 id="market-title">Choose a face.</h2></div>
          <div className={`source-status ${snapshot ? "" : "is-loading"}`}><span className="source-status__pulse" />{snapshot ? (snapshot.source.isPreview ? `LIVE BASE PREVIEW · ${snapshot.source.tokenSymbol.toUpperCase()}` : `LIVE ON ${snapshot.source.chainName.toUpperCase()}`) : "CONNECTING TO BASECAT"}</div>
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
                {side === "token" ? "TRADE THE PRICE FACE" : "MINT THE VOLUME FACE"}<span aria-hidden="true">↗</span>
              </a>
            </div>

            <PerformanceChart points={snapshot?.series ?? []} range={range} side={side} loading={loading} onRangeChange={onRangeChange} />

            <div className="market-footer">
              <div className="market-legend"><span><i className="legend-line legend-line--token" /> SIDES · FDV</span><span><i className="legend-line legend-line--lp" /> lpSIDES · NAV / SHARE</span></div>
              <div className="market-links"><a href={snapshot?.links.dexscreener ?? "https://dexscreener.com/base"} target="_blank" rel="noreferrer">DEXSCREENER ↗</a><a href={snapshot?.links.explorer ?? "https://basescan.org"} target="_blank" rel="noreferrer">BASESCAN ↗</a><a href={snapshot?.links.market ?? "https://lptoken.fun"} target="_blank" rel="noreferrer">LPTOKEN.FUN ↗</a></div>
            </div>

            {isFlipping && (
              <div className="market-flip-overlay" aria-live="polite">
                <div className="flip-loader"><div className="flip-loader__coin"><span /></div><div><p className="mono-label">{isHolding ? "JANUS IS THINKING" : "CROSSING THE THRESHOLD"}</p><strong>{isHolding ? "Release to reveal a random face." : "Revealing the live side…"}</strong></div></div>
                <div className="flip-progress"><span /></div>
              </div>
            )}
          </div>
        )}

        <section className="market-instruments" aria-label="Market instruments and verified links">
          <div className="market-instruments__head">
            <div><p className="mono-label">MARKET IDENTITY</p><h3>{snapshot ? `${snapshot.source.tokenName} · ${snapshot.source.chainName}` : "Connecting to Base"}</h3></div>
            {snapshot?.source.isPreview && <span>PREVIEW DATA · REPLACE AT SIDES LAUNCH</span>}
          </div>
          <dl>
            <div className="contract-row">
              <dt>CONTRACT</dt>
              <dd><code title={snapshot?.source.tokenAddress}>{snapshot?.source.tokenAddress ?? "Waiting for the live contract…"}</code>{snapshot && <button type="button" onClick={copyContract}>{copied ? "COPIED" : "COPY"}</button>}</dd>
            </div>
            <div><dt>CHAIN</dt><dd>{snapshot?.source.chainName ?? "Base"}</dd></div>
            <div><dt>QUOTE</dt><dd>{snapshot?.source.quoteSymbol ?? "—"}</dd></div>
            <div><dt>VAULT</dt><dd><code title={snapshot?.source.vaultAddress}>{snapshot ? `${snapshot.source.vaultAddress.slice(0, 8)}…${snapshot.source.vaultAddress.slice(-6)}` : "—"}</code></dd></div>
          </dl>
          <div className="market-instruments__links">
            <a href={snapshot?.links.dexscreener ?? "https://dexscreener.com/base"} target="_blank" rel="noreferrer">VIEW ON DEXSCREENER ↗</a>
            <a href={snapshot?.links.explorer ?? "https://basescan.org"} target="_blank" rel="noreferrer">VERIFY ON BASESCAN ↗</a>
            <a href={snapshot?.links.market ?? "https://lptoken.fun"} target="_blank" rel="noreferrer">OPEN LPTOKEN.FUN ↗</a>
          </div>
        </section>

        <div className="market-note"><span>READ-ONLY MARKET VIEW</span><p>Market execution opens on lptoken.fun. No wallet connects to this site.</p></div>
      </div>
    </section>
  );
}
