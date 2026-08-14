"use client";

import { useCallback, useState } from "react";
import { AlertsPanel } from "@/components/AlertsPanel";
import { HoldingsPanel } from "@/components/HoldingsPanel";

export default function HoldingsPage() {
  const [alertsRefreshToken, setAlertsRefreshToken] = useState(0);
  const [metrics, setMetrics] = useState({
    portfolioValue: 49743.87,
    blendedApy: 1.58,
    idleCapital: 25248.77,
  });

  const handleHoldingsSaved = useCallback(() => setAlertsRefreshToken((t) => t + 1), []);

  const handleMetricsCalculated = useCallback(
    (newMetrics: { portfolioValue: number; blendedApy: number; idleCapital: number }) => {
      setMetrics(newMetrics);
    },
    []
  );

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 py-8">
      {/* Top Header Row with Portfolio Metrics */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
        {/* Left Title & Subtitle */}
        <div className="flex flex-col gap-1.5 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
            Holdings &amp; alerts
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 font-medium leading-relaxed font-sans">
            Native FLR balance is read on-chain from Coston2 via <code className="text-accent bg-white/5 px-1 py-0.5 rounded">eth_getBalance</code>. Everything else you add is saved to your portfolio and monitored for better matches.
          </p>
        </div>

        {/* Right Portfolio Metrics Grid (3 columns) */}
        <div className="flex items-center gap-6 font-mono-tech shrink-0">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
              PORTFOLIO VALUE
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              ${metrics.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
              BLENDED APY
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-success">
              {metrics.blendedApy.toFixed(2)}%
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
              IDLE CAPITAL
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber">
              ${metrics.idleCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Goal-matched opportunities (Alerts section) */}
      <AlertsPanel refreshToken={alertsRefreshToken} />

      {/* Portfolio Holdings Section */}
      <div id="holdings-section">
        <HoldingsPanel onSaved={handleHoldingsSaved} onMetricsCalculated={handleMetricsCalculated} />
      </div>

      {/* Footer text */}
      <footer className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400 font-mono-tech">
        <span>Non-custodial · AssetRouter never holds your keys or funds. · FTSOv2 · DeFiLlama · LI.FI</span>
        <span>Not financial advice.</span>
      </footer>
    </main>
  );
}
