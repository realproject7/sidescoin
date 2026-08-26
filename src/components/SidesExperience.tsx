"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MarketRange, MarketSide, MarketSnapshot } from "@/lib/market-types";
import { SIDES_LAUNCH_TRANSACTION_URL, SIDES_MARKET_URL } from "@/lib/sides";
import { BrandMark } from "./BrandMark";
import { CoinHero, type CoinHeroHandle } from "./CoinHero";
import type { CoinPhase } from "./coin-types";
import { MarketPanel } from "./MarketPanel";

const phaseCopy: Record<CoinPhase, { eyebrow: string; instruction: string }> = {
  idle: { eyebrow: "TAP TO FLIP · HOLD TO SPIN", instruction: "Ask Janus." },
  holding: { eyebrow: "JANUS IS THINKING", instruction: "Release for a random face." },
  landing: { eyebrow: "CROSSING THE THRESHOLD", instruction: "Revealing the live view…" },
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
  const marketUrl = snapshot?.links.market ?? SIDES_MARKET_URL;
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
            <p className="hero-kicker"><span /> JANUS JUST FOUND BASE</p>
            <h1><span>ONE COIN.</span><span className="hero-title__accent">TWO FACES.</span></h1>
            <a className="hero-cta" href={marketUrl} target="_blank" rel="noreferrer">TRADE SIDES <span aria-hidden="true">↗</span></a>
          </div>

          <div className={`hero-coin hero-coin--${phase}`}>
            <div className="face-status"><span className={side === "token" ? "is-token" : "is-lp"} />{side === "token" ? "PRICE FACE" : "VOLUME FACE"}</div>
            <span className="coin-sticker coin-sticker--ticker" aria-hidden="true">JANUS<br />ON BASE</span>
            <span className="coin-sticker coin-sticker--mood" aria-hidden="true">TWO-FACED<br />BY DESIGN</span>
            <CoinHero ref={coinRef} side={side} onPhaseChange={setPhase} onSettled={setSide} />
            <div className="hero-coin__instruction" aria-live="polite"><strong>{currentCopy.eyebrow}</strong><span>{currentCopy.instruction}</span></div>
          </div>

          <div className={`hero-choice hero-choice--${side}`} aria-live="polite">
            <span className="hero-choice__price">PRICE</span><i>VS</i><span className="hero-choice__volume">VOLUME</span>
          </div>
        </section>

        <div className="meme-ticker" aria-hidden="true">
          <div><span>CREATOR BOUGHT ZERO</span> · PRICE LOOKS FORWARD · <span>VOLUME LOOKS BACK</span> · FLIP IT · JANUS NEVER TRADES ONE-SIDED · <span>CREATOR BOUGHT ZERO</span> · PRICE LOOKS FORWARD · <span>VOLUME LOOKS BACK</span> · FLIP IT · JANUS NEVER TRADES ONE-SIDED ·</div>
        </div>
      </div>

      <MarketPanel snapshot={snapshot} side={side} phase={phase} loading={loading} range={range} error={error} onRangeChange={changeRange} onSelectSide={chooseSide} onRetry={retry} />

      <section className="launch-proof" aria-labelledby="launch-proof-title">
        <div className="launch-proof__story">
          <p className="mono-label">LIVE EXPERIMENT · VERIFIED ON BASE</p>
          <h2 id="launch-proof-title">I made the coin that explains lpTOKEN.fun. Then I bought neither side.</h2>
          <p>Sides Coin launched as a live two-sided market experiment: SIDES for price exposure and lpSIDES for liquidity exposure. The creator initial buy was exactly 0 ETH.</p>
          <a href={SIDES_LAUNCH_TRANSACTION_URL} target="_blank" rel="noreferrer">VERIFY THE LAUNCH ↗</a>
        </div>
        <dl className="launch-proof__facts">
          <div><dt>0 ETH</dt><dd>Creator initial buy</dd></div>
          <div><dt>0 SIDES</dt><dd>Held by the creator at launch</dd></div>
          <div><dt>1B</dt><dd>Fixed token supply</dd></div>
          <div><dt>PERMANENT</dt><dd>One-sided launch liquidity</dd></div>
        </dl>
        <p className="launch-proof__note">The zero-buy claim refers to the atomic creator buy at launch. Protocol-defined creator fee rights still apply.</p>
      </section>

      <section className="mechanism" aria-labelledby="mechanism-title">
        <div className="mechanism__lead">
          <p className="mono-label">THE JANUS MODEL · ONE POOL</p>
          <h2 id="mechanism-title">Two faces.<br />Two exposures.</h2>
          <p>SIDES is designed around lptoken.fun&apos;s two-exposure structure: the token and its LP share point to the same underlying pool, but they express different ways to hold the market.</p>
        </div>
        <div className="mechanism__steps">
          <article><span>PRICE FACE</span><h3>Hold the token</h3><p>Direct exposure to the token&apos;s market price. This is the more directional, volatile side of the coin.</p></article>
          <article><span>VOLUME FACE</span><h3>Hold the LP share</h3><p>lpSIDES represents a transferable pro-rata claim on the vault&apos;s two-asset LP position, earned fees, and idle balances.</p></article>
          <article><span>FEE FLOW</span><h3>Volume can become NAV</h3><p>Swap fees earned by the full-range vault stay in shareholder NAV and can be compounded back into liquidity.</p></article>
          <article><span>FAIR ENTRY</span><h3>Mint against assets</h3><p>New shares are priced against total vault assets so later minters cannot simply capture NAV accumulated before they arrived.</p></article>
        </div>
        <dl className="mechanism__facts">
          <div><dt>ONE POOL</dt><dd>No second token-pair market or separate price to arbitrage</dd></div>
          <div><dt>0%</dt><dd>Performance fee on full-range position earnings</dd></div>
          <div><dt>0.30%</dt><dd>Backed-share fee on public mint and redeem</dd></div>
        </dl>
        <section className="mechanism__math" aria-labelledby="math-title">
          <header>
            <p className="mono-label">THE MODEL · IDEALIZED WHERE NOTED</p>
            <h3 id="math-title">The math behind both faces.</h3>
            <p>The vault is an asset-backed share, not a second speculative token-pair market. These equations show what a holder owns and why price and volume affect the two sides differently.</p>
          </header>
          <div className="math-grid">
            <article>
              <span>PRO-RATA HOLDER CLAIM</span>
              <code className="math-equation math-equation--claim">
                <i>claim</i><sub>i</sub>(s) = <span className="math-fraction"><i>s</i><i>S</i></span> × [ principal<sub>i</sub> + fees<sub>i</sub> + idle<sub>i</sub> + launchNAV<sub>i</sub> ]
              </code>
              <p>For each pool asset i, a holder owns their share s/S of the vault&apos;s exact principal, pending fees, idle balances, and applicable launch NAV.</p>
            </article>
            <article>
              <span>IDEALIZED PRICE SENSITIVITY</span>
              <code className="math-equation"><i>r</i> = P<sub>t</sub> / P<sub>0</sub></code>
              <div className="math-comparison"><code>Token ≈ r</code><code>lpTOKEN ≈ √r</code><code>∂ ln V<sub>LP</sub> / ∂ ln P ≈ 1/2</code></div>
              <p>Deep inside the active range and before fees, the LP side still follows price direction with roughly half the local sensitivity of token-only exposure.</p>
            </article>
            <article>
              <span>VOLUME-TO-NAV ENGINE</span>
              <code className="math-equation">fees ≈ routed volume × pool fee × active-liquidity share</code>
              <p>Full-range earnings remain in shareholder NAV. Pairable balances may be compounded; unmatched residue remains idle but claimable.</p>
            </article>
            <article>
              <span>PLATFORM-LAUNCH FLOOR FLOW</span>
              <code className="math-equation">≈ 0.20% buy volume<sub>counter</sub> + 0.60% sell volume<sub>token</sub></code>
              <p>For platform launches only, launch-fee NAV held by non-redeemable bootstrap shares accumulates permanently. It adds depth, not a guaranteed price.</p>
            </article>
          </div>
        </section>
        <div className="mechanism__flow">
          <span>ROUTED VOLUME</span><b>→</b><span>SWAP FEES</span><b>→</b><span>VAULT NAV</span><b>→</b><span>COMPOUND</span><b>→</b><span>LIQUIDITY</span>
        </div>
        <div className="mechanism__risk">
          <p><strong>Not a pure volume bet.</strong> lpTOKEN value still depends on price path, impermanent loss, LVR, routing, competing liquidity, token risk, and smart-contract risk. For platform launches, non-redeemable bootstrap shares can create a permanent liquidity floor, but never a guaranteed token price.</p>
          <a href="https://lptoken.fun/methodology" target="_blank" rel="noreferrer">READ THE FULL METHODOLOGY ↗</a>
        </div>
      </section>

      <footer className="site-footer"><div className="wordmark wordmark--footer"><BrandMark compact /><span>SIDES</span></div><p>ONE COIN. TWO FACES.</p><a href={marketUrl} target="_blank" rel="noreferrer">TRADE ON LPTOKEN.FUN ↗</a></footer>
    </main>
  );
}
