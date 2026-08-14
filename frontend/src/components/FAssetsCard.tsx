"use client";

/**
 * FAssetsCard — contextual card shown when the user's intent involves XRP.
 *
 * Reads live FTestXRP Asset Manager parameters from Coston2 and the current
 * XRP/USD price from FTSOv2. All data is clearly labeled as testnet.
 * If live data is unavailable, shows the simulated fallback with a label.
 */

import { useEffect, useState } from "react";
import { getFAssetsInfo, getPrices } from "@/lib/api";
import type { FAssetsInfo, FeedValue } from "@/lib/types";

interface FAssetsCardProps {
  xrpAmount?: string; // user-supplied manual XRP amount for preview
}

export function FAssetsCard({ xrpAmount }: FAssetsCardProps) {
  const [info, setInfo] = useState<FAssetsInfo | null>(null);
  const [xrpPrice, setXrpPrice] = useState<FeedValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [infoRes, pricesRes] = await Promise.all([
          getFAssetsInfo(),
          getPrices("XRP/USD"),
        ]);
        if (cancelled) return;
        setInfo(infoRes);
        setXrpPrice(pricesRes.feeds?.[0] ?? null);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load FAssets data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const xrpPriceUSD = xrpPrice?.value ?? null;
  const lotXRP = info?.lotSizeXRP ?? null;
  const crFeePct = info?.collateralReservationFeePct ?? null;

  // Preview: how many lots does the user's XRP amount cover?
  const userXRP = parseFloat(xrpAmount ?? "") || null;
  const lotsPreview = userXRP && lotXRP ? Math.floor(userXRP / lotXRP) : null;
  const valueUSD = userXRP && xrpPriceUSD ? (userXRP * xrpPriceUSD).toFixed(2) : null;

  return (
    <div className="rounded-2xl border border-amber/30 bg-amber/5 backdrop-blur-xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-amber text-xl">⚡</span>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-ivory">XRP → FTestXRP on Flare</h3>
            <p className="text-xs text-amber font-mono-tech tracking-wider">
              FAssets · {info?.network ?? "Coston2 (testnet)"}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-xs font-mono-tech text-amber tracking-wider uppercase font-bold">
          Testnet
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4 text-xs sm:text-sm text-neutral-300">
          <span className="animate-spin inline-block">◌</span>
          Loading live Coston2 parameters…
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-danger py-2">{error}</p>
      )}

      {!loading && info && (
        <>
          {info.simulated && (
            <div className="mb-3 rounded-xl border border-amber/20 bg-amber/5 px-3.5 py-2.5 text-xs font-mono-tech text-amber font-medium">
              ⚠ Simulated — {info.simulationReason ?? "Coston2 RPC unavailable"}
            </div>
          )}

          {/* Live Parameter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs sm:text-sm mb-4">
            {/* XRP/USD from FTSOv2 */}
            <div className="rounded-xl border border-accent/30 bg-accent/10 p-3">
              <div className="text-accent text-xs font-bold">XRP/USD · FTSOv2</div>
              <strong className="text-accent font-bold block mt-0.5 text-sm sm:text-base">
                {xrpPrice?.value != null
                  ? `$${xrpPrice.value.toFixed(4)}`
                  : "—"}
              </strong>
              {xrpPrice?.simulated && (
                <span className="text-[10px] text-neutral-400">(simulated)</span>
              )}
            </div>

            {/* Minimum lot size */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-neutral-300 text-xs font-medium">Min. Lot</div>
              <strong className="text-white font-bold block mt-0.5 text-sm sm:text-base">
                {lotXRP != null ? `${lotXRP} XRP` : "—"}
              </strong>
            </div>

            {/* Collateral reservation fee */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-neutral-300 text-xs font-medium">Reservation Fee</div>
              <strong className="text-white font-bold block mt-0.5 text-sm sm:text-base">
                {crFeePct != null ? `${crFeePct.toFixed(2)}%` : "—"}
              </strong>
            </div>

            {/* fAsset decimals */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-neutral-300 text-xs font-medium">Asset Decimals</div>
              <strong className="text-white font-bold block mt-0.5 text-sm sm:text-base">
                {info.assetDecimals ?? "—"}
              </strong>
            </div>
          </div>

          {/* User preview section */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 mb-4">
            <div className="text-xs text-neutral-300 font-mono-tech mb-2 uppercase tracking-wider font-semibold">
              XRP Amount Preview (manual — no XRPL wallet required)
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                step={lotXRP ?? 1}
                placeholder={`Min ${lotXRP ?? "?"} XRP per lot`}
                value={xrpAmount ?? ""}
                readOnly
                className="flex-1 rounded-xl border border-white/10 bg-[#121217]/90 px-3.5 py-2.5 text-sm sm:text-base text-white placeholder-neutral-500 outline-none font-medium"
              />
              <div className="text-xs sm:text-sm text-neutral-300 min-w-[100px] text-right font-medium">
                {lotsPreview != null && lotXRP != null ? (
                  <>
                    <span className="text-white font-bold">{lotsPreview}</span>{" "}
                    <span>lot{lotsPreview !== 1 ? "s" : ""}</span>
                    {valueUSD && (
                      <div className="text-xs text-neutral-400">≈ ${valueUSD} USD</div>
                    )}
                  </>
                ) : (
                  <span className="text-neutral-400">Enter an amount</span>
                )}
              </div>
            </div>
          </div>

          {/* Pathway explanation */}
          <div className="space-y-2 text-xs sm:text-sm text-neutral-300 mb-4">
            {[
              { step: 1, text: "Send XRP to FAssets Core Vault on XRPL with correct memo/lot" },
              { step: 2, text: "FTestXRP (ERC-20) is minted to your Flare wallet on Coston2" },
              { step: 3, text: "Supply FTestXRP to a Flare DeFi protocol (SparkDEX, Kinetic)" },
              { step: 4, text: "Redeem FTestXRP → XRP on XRPL at any time" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber/20 text-amber text-xs font-bold flex items-center justify-center">
                  {step}
                </span>
                <span className="leading-relaxed">{text}</span>
              </div>
            ))}
          </div>

          {/* Contract addresses */}
          <details className="text-xs text-neutral-400 font-mono-tech">
            <summary className="cursor-pointer hover:text-neutral-200 transition-colors mb-1">
              Contract addresses (Coston2)
            </summary>
            <div className="space-y-1.5 mt-1.5 pl-3 border-l border-white/10">
              <div>
                <span className="text-neutral-300">Asset Manager: </span>
                <span className="break-all text-white font-medium">{info.assetManager}</span>
              </div>
              <div>
                <span className="text-neutral-300">FTestXRP Token: </span>
                <span className="break-all text-white font-medium">{info.fAssetToken}</span>
              </div>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
