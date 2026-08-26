"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MarketRange, MarketSide, MarketSnapshot } from "@/lib/market-types";
import { BrandMark } from "./BrandMark";
import { CoinHero, type CoinHeroHandle } from "./CoinHero";
import type { CoinPhase } from "./coin-types";
import { MarketPanel } from "./MarketPanel";

const phaseCopy: Record<CoinPhase, { eyebrow: string; instruction: string }> = {
  idle: { eyebrow: "CLICK · TAP · FLIP", instruction: "Switch the market side." },
  landing: { eyebrow: "COIN IN FLIGHT", instruction: "Switching the live view…" },
};

export function SidesExperience() {
  const coinRef = useRef<CoinHeroHandle>(null);
  const requestRef = useRef(0);
  const [side, setSide] = useState<MarketSide>("token");
  const [phase, setPhase] = useState<CoinPhase>("idle");
  const [range, setRange] = useState<MarketRange>("7d");
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestRef.current;
    fetch(`/api/market?range=${range}`, { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("The live market feed is unavailable");
        return (await response.json()) as MarketSnapshot;
      })
      .then((data) => { if (requestId === requestRef.current) setSnapshot(data); })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        if (requestId === requestRef.current) setError(requestError instanceof Error ? requestError.message : "Market request failed");
      })
      .finally(() => { if (requestId === requestRef.current) setLoading(false); });
    return () => controller.abort();
  }, [range, retryKey]);

  const chooseSide = useCallback((nextSide: MarketSide) => {
    if (nextSide !== side) coinRef.current?.flipTo(nextSide);
  }, [side]);
  const changeRange = useCallback((nextRange: MarketRange) => {
    if (nextRange === range) return;
    setLoading(true);
    setError(null);
    setRange(nextRange);
  }, [range]);
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRetryKey((value) => value + 1);
  }, []);
  const marketUrl = snapshot?.links.market ?? "https://lptoken.fun";
  const currentCopy = phaseCopy[phase];

  return (
    <main>
      <div className="site-shell">
        <header className="site-header">
          <a href="#top" className="wordmark" aria-label="SIDES home"><BrandMark compact /><span>SIDES</span></a>
          <div className="site-header__meta"><span><i /> BUILT ON BASE</span><a href={marketUrl} target="_blank" rel="noreferrer">OPEN MARKET ↗</a></div>
        </header>

        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="hero-kicker"><span /> SIDES ON BASE</p>
            <h1><span>TRADE</span><span className="hero-title__accent">DUAL-SIDE COINS</span></h1>
          </div>

          <div className={`hero-coin hero-coin--${phase}`}>
            <div className="face-status"><span className={side === "token" ? "is-token" : "is-lp"} />{side === "token" ? "TOKEN SIDE" : "LIQUIDITY SIDE"}</div>
            <CoinHero ref={coinRef} side={side} onPhaseChange={setPhase} onSettled={setSide} />
            <div className="hero-coin__instruction" aria-live="polite"><strong>{currentCopy.eyebrow}</strong><span>{currentCopy.instruction}</span></div>
          </div>

          <div className={`hero-choice hero-choice--${side}`} aria-live="polite">
            <span className="hero-choice__price">PRICE</span><i>VS</i><span className="hero-choice__volume">VOLUME</span>
          </div>
        </section>
      </div>

      <MarketPanel snapshot={snapshot} side={side} phase={phase} loading={loading} range={range} error={error} onRangeChange={changeRange} onSelectSide={chooseSide} onRetry={retry} />

      <section className="mechanism" aria-labelledby="mechanism-title">
        <div className="mechanism__lead"><p className="mono-label">THE DUAL-SIDE MARKET</p><h2 id="mechanism-title">One coin.<br />Two sides.</h2></div>
        <div className="mechanism__steps">
          <article><span>01 · PRICE</span><h3>Trade SIDES</h3><p>Take the direct meme-coin position and follow the token price.</p></article>
          <article><span>02 · VOLUME</span><h3>Mint lpSIDES</h3><p>Take the liquidity-side position and follow the market activity behind the coin.</p></article>
          <article><span>03 · FLIP</span><h3>Switch the view</h3><p>Tap the coin to move between both sides. Execution stays on lptoken.fun.</p></article>
        </div>
      </section>

      <footer className="site-footer"><div className="wordmark wordmark--footer"><BrandMark compact /><span>SIDES</span></div><p>TRADE PRICE. OR VOLUME.</p><a href={marketUrl} target="_blank" rel="noreferrer">TRADE ON LPTOKEN.FUN ↗</a></footer>
    </main>
  );
}
