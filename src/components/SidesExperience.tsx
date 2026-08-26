"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MarketRange, MarketSide, MarketSnapshot } from "@/lib/market-types";
import { BrandMark } from "./BrandMark";
import { CoinHero, type CoinHeroHandle } from "./CoinHero";
import type { CoinPhase } from "./coin-types";
import { MarketPanel } from "./MarketPanel";

const phaseCopy: Record<CoinPhase, { eyebrow: string; instruction: string }> = {
  idle: { eyebrow: "PRESS + HOLD", instruction: "Release to let the coin choose." },
  holding: { eyebrow: "MOMENTUM BUILDING", instruction: "Keep holding. Release when it feels right." },
  landing: { eyebrow: "COIN IN FLIGHT", instruction: "The next side is locking in." },
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

  const chooseSide = useCallback((nextSide: MarketSide) => { coinRef.current?.flipTo(nextSide); }, []);
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
            <p className="hero-kicker"><span /> A TWO-SIDED MARKET ON BASE</p>
            <h1>EVERY COIN<span>HAS TWO SIDES.</span></h1>
            <p className="hero-statement">THIS ONE TOKENIZES THE OTHER.</p>
            <p className="hero-body">SIDES follows the token. lpSIDES tracks a share of the liquidity vault behind it. Hold the coin, then let the market pick a side.</p>
            <div className="hero-instruction" aria-live="polite"><div className={`instruction-icon instruction-icon--${phase}`} aria-hidden="true"><span /></div><div><strong>{currentCopy.eyebrow}</strong><p>{currentCopy.instruction}</p></div></div>
          </div>

          <div className={`hero-coin hero-coin--${phase}`}>
            <div className="face-status"><span className={side === "token" ? "is-token" : "is-lp"} />{side === "token" ? "TOKEN SIDE" : "LIQUIDITY SIDE"}</div>
            <CoinHero ref={coinRef} onPhaseChange={setPhase} onSettled={setSide} />
            <div className="coin-scale" aria-hidden="true"><span>SIDES</span><i /><span>lpSIDES</span></div>
          </div>

          <a className="scroll-cue" href="#market"><span>SEE BOTH SIDES</span><i aria-hidden="true">↓</i></a>
        </section>
      </div>

      <MarketPanel snapshot={snapshot} side={side} phase={phase} loading={loading} range={range} error={error} onRangeChange={changeRange} onSelectSide={chooseSide} onRetry={retry} />

      <section className="mechanism" aria-labelledby="mechanism-title">
        <div className="mechanism__lead"><p className="mono-label">ONE POOL · TWO POSITIONS</p><h2 id="mechanism-title">The other side<br />is the liquidity.</h2></div>
        <div className="mechanism__steps">
          <article><span>01</span><h3>Trade SIDES</h3><p>Take direct price exposure through the token market.</p></article>
          <article><span>02</span><h3>Mint lpSIDES</h3><p>Enter the automatic liquidity vault and receive its LP share.</p></article>
          <article><span>03</span><h3>Choose anytime</h3><p>Buy or sell the token. Mint or redeem the LP share on lptoken.fun.</p></article>
        </div>
      </section>

      <footer className="site-footer"><div className="wordmark wordmark--footer"><BrandMark compact /><span>SIDES</span></div><p>THE TOKEN AND THE LIQUIDITY BEHIND IT.</p><a href={marketUrl} target="_blank" rel="noreferrer">TRADE ON LPTOKEN.FUN ↗</a></footer>
    </main>
  );
}
