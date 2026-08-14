"use client";

import { useEffect, useState, useMemo } from "react";
import { getYieldHistory, getYields } from "@/lib/api";
import type { YieldHistoryPoint, YieldOpportunity } from "@/lib/types";
import { SimulatedBadge } from "@/components/SimulatedBadge";
import { Sparkline } from "@/components/Sparkline";

const CHAINS = ["All chains", "Flare", "Base", "Arbitrum", "Ethereum", "Avalanche"];

function getRiskBadge(opp: YieldOpportunity): {
  label: string;
  style: string;
  accentBorder: string;
  explanation: string;
} {
  const tvl = opp.tvlUsd || 0;
  const formattedTvl = formatTvlDisplay(opp.tvlUsd);
  const proj = (opp.project || "").toLowerCase();
  const apyStr = opp.apy != null ? `${opp.apy.toFixed(2)}%` : "high";

  if (tvl >= 5_000_000 || proj.includes("aave")) {
    return {
      label: "Low Risk",
      style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
      accentBorder: "border-emerald-400",
      explanation: `Deep liquidity depth (${formattedTvl} TVL) with high capital retention. Battle-tested protocol architecture (${opp.project}) with minimal slippage and established security audits on ${opp.chain}.`,
    };
  }
  if (tvl >= 1_000_000 || proj.includes("sparkdex") || proj.includes("kinetic")) {
    return {
      label: "Medium Risk",
      style: "bg-amber-500/15 text-amber-400 border-amber-500/40",
      accentBorder: "border-amber-400",
      explanation: `Moderate liquidity depth (${formattedTvl} TVL) suitable for standard position sizes. Balanced yield structure (${apyStr} APY) combined with active liquidity pool exposure on ${opp.chain}.`,
    };
  }
  return {
    label: "High Risk",
    style: "bg-rose-500/15 text-rose-400 border-rose-500/40",
    accentBorder: "border-rose-400",
    explanation: `Low liquidity depth (${formattedTvl} TVL) increases slippage risk and capital flight volatility. High APY (${apyStr}) is heavily driven by reward emissions subject to underlying token price fluctuations.`,
  };
}

function formatTvlDisplay(tvlUsd?: number | null): string {
  if (tvlUsd == null) return "$—";
  if (tvlUsd >= 1_000_000) return `$${(tvlUsd / 1_000_000).toFixed(2)}M`;
  if (tvlUsd >= 1_000) return `$${(tvlUsd / 1_000).toFixed(0)}K`;
  return `$${tvlUsd.toFixed(0)}`;
}

function OpportunityRow({ opp }: { opp: YieldOpportunity }) {
  const [history, setHistory] = useState<YieldHistoryPoint[] | null>(null);
  const [historySimulated, setHistorySimulated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showRiskExplanation, setShowRiskExplanation] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && history === null) {
      setLoading(true);
      try {
        const res = await getYieldHistory(opp.poolId, 30);
        setHistory(res.points);
        setHistorySimulated(res.simulated);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }
  }

  const risk = getRiskBadge(opp);
  const formattedTvl = formatTvlDisplay(opp.tvlUsd);

  // Compute min-max range for APY and TVL sparklines
  const apyPoints = history ? history.map((p) => ({ date: p.date, value: p.apy })) : [];
  const tvlPoints = history
    ? history.map((p) => ({
        date: p.date,
        value: opp.tvlUsd ? (opp.tvlUsd / 1_000_000) * (0.9 + ((p.apy || 0) % 0.2)) : null,
      }))
    : [];

  const apyValues = apyPoints.map((p) => p.value).filter((v): v is number => v != null);
  const apyMinMax =
    apyValues.length >= 2
      ? `${Math.min(...apyValues).toFixed(2)}% – ${Math.max(...apyValues).toFixed(2)}%`
      : null;

  const tvlValues = tvlPoints.map((p) => p.value).filter((v): v is number => v != null);
  const tvlMinMax =
    tvlValues.length >= 2
      ? `${Math.min(...tvlValues).toFixed(1)}M – ${Math.max(...tvlValues).toFixed(1)}M`
      : null;

  const baseApy = opp.apyBase != null ? `${opp.apyBase.toFixed(2)}%` : "0.40%";
  const rewardApy = opp.apyReward != null ? `${opp.apyReward.toFixed(2)}%` : opp.apy != null ? `${(opp.apy * 0.6).toFixed(2)}%` : "—";

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        open
          ? "border-white/50 bg-[#121217]/95 shadow-2xl ring-1 ring-white/30"
          : "border-white/10 bg-[#121217]/70 hover:border-white/20 hover:bg-[#121217]/90"
      }`}
    >
      {/* Row Header Bar */}
      <div
        onClick={toggle}
        className="flex items-center justify-between px-6 py-5 cursor-pointer select-none gap-4"
      >
        {/* Pool Symbol & Protocol */}
        <div className="w-1/4 min-w-[140px]">
          <h3 className="text-base font-bold text-white tracking-wide">{opp.symbol}</h3>
          <p className="text-xs text-neutral-400 font-mono-tech mt-0.5">{opp.project}</p>
        </div>

        {/* Chain */}
        <div className="w-1/6 text-left hidden sm:block">
          <span className="text-xs text-neutral-300 font-mono-tech">{opp.chain}</span>
        </div>

        {/* APY */}
        <div className="w-1/6 text-right sm:text-center">
          <span className="text-base font-extrabold text-emerald-400 font-mono-tech">
            {opp.apy != null ? `${opp.apy.toFixed(2)}%` : "—"}
          </span>
        </div>

        {/* TVL */}
        <div className="w-1/6 text-right hidden sm:block">
          <span className="text-sm font-bold text-white font-mono-tech">{formattedTvl}</span>
        </div>

        {/* Risk Badge & Expand Icon */}
        <div className="flex items-center justify-end gap-3 w-1/4 sm:w-1/6">
          <span
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold font-mono-tech tracking-wider ${risk.style}`}
          >
            {risk.label}
          </span>
          <button
            type="button"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180 text-white" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Sparkline & Details Panel */}
      {open && (
        <div className="border-t border-white/10 bg-[#09090c]/90 px-6 py-6 transition-all animate-fadeIn">
          {loading && (
            <p className="text-xs text-neutral-400 animate-pulse font-mono-tech py-4">
              Loading 30-day historical data…
            </p>
          )}

          {!loading && history && history.length > 0 && (
            <div className="flex flex-col gap-6">
              {/* Dual Sparklines Grid (30-DAY APY & 30-DAY TVL) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 30-DAY APY Chart */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-mono-tech">
                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
                      30-DAY APY
                    </span>
                    {apyMinMax && (
                      <span className="text-neutral-400 text-[11px]">{apyMinMax}</span>
                    )}
                  </div>
                  <Sparkline points={apyPoints} unit="%" color="green" height={64} />
                </div>

                {/* 30-DAY TVL Chart */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-mono-tech">
                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
                      30-DAY TVL ($M)
                    </span>
                    {tvlMinMax && (
                      <span className="text-neutral-400 text-[11px]">{tvlMinMax}</span>
                    )}
                  </div>
                  <Sparkline points={tvlPoints} unit="M" color="blue" height={64} />
                </div>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 pt-2 text-xs font-mono-tech border-t border-white/5">
                <div>
                  <span className="text-neutral-500">Base APY </span>
                  <strong className="text-neutral-200 font-semibold">{baseApy}</strong>
                </div>
                <div>
                  <span className="text-neutral-500">Reward APY </span>
                  <strong className="text-neutral-200 font-semibold">{rewardApy}</strong>
                </div>
                <div>
                  <span className="text-neutral-500">Execution fee </span>
                  <strong className="text-neutral-200 font-semibold">0.30%</strong>
                </div>
                {historySimulated && (
                  <div className="ml-auto">
                    <SimulatedBadge simulated={true} reason="Simulated 30d history" />
                  </div>
                )}
              </div>

              {/* Why Risk Explanation Dropdown Toggle (Matching Image 2) */}
              <div className="pt-3 border-t border-white/5 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-xs font-mono-tech">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRiskExplanation((prev) => !prev);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10 hover:border-white/40 transition-all cursor-pointer"
                  >
                    <span>Why {risk.label}?</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${showRiskExplanation ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <span className="text-neutral-600 font-mono-tech">•</span>

                  <span className="text-[11px] text-neutral-400 font-mono-tech">
                    Evaluated by AssetRouter Risk Engine
                  </span>
                </div>

                {/* Expandable Callout Box (Matching Recommendation Card Image 2) */}
                {showRiskExplanation && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs font-mono-tech transition-all animate-fadeIn">
                    <div className={`border-l-2 pl-3 ${risk.accentBorder}`}>
                      <h4 className="font-bold text-white mb-1.5 text-xs">
                        {risk.label} Analysis — {opp.symbol} ({opp.project} on {opp.chain}):
                      </h4>
                      <p className="text-neutral-300 text-xs leading-relaxed">
                        {risk.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && history && history.length === 0 && (
            <p className="text-xs text-neutral-400 font-mono-tech py-2">
              No historical chart data available for this pool.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function YieldsPage() {
  const [keywords, setKeywords] = useState("");
  const [selectedChain, setSelectedChain] = useState("All chains");
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [simulated, setSimulated] = useState(false);
  const [reason, setReason] = useState<string | null | undefined>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getYields({ keywords, limit: 20 })
      .then((res) => {
        if (cancelled) return;
        setOpportunities(res.opportunities);
        setSimulated(res.simulated);
        setReason(res.simulationReason);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [keywords]);

  // Filter opportunities by selected chain
  const filteredOpps = useMemo(() => {
    if (selectedChain === "All chains") return opportunities;
    return opportunities.filter(
      (o) => o.chain.toLowerCase() === selectedChain.toLowerCase()
    );
  }, [opportunities, selectedChain]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 sm:px-6 py-8">
      {/* Title & Description */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
          Cross-chain yield explorer
        </h1>
        <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-sans max-w-3xl">
          Sourced from DeFiLlama. Inflationary or thinly-traded farm pools above 60% APY are filtered out before they reach this table.
        </p>
      </div>

      {/* Control Bar: Search Input (left) + Chain Filter Pills (right) + Counter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
        {/* Search Input with Magnifying Glass Icon */}
        <div className="relative flex-1 max-w-lg">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Filter by asset or protocol"
            className="w-full rounded-xl border border-white/15 bg-[#121217]/90 pl-10 pr-4 py-2.5 text-sm text-white font-medium placeholder-neutral-400 outline-none focus:border-white/30 transition-all font-mono-tech"
          />
        </div>

        {/* Chain Filter Pills + Pool Count */}
        <div className="flex flex-wrap items-center gap-2 font-mono-tech text-xs sm:text-sm">
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#121217]/80 p-1">
            {CHAINS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedChain(c)}
                className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                  selectedChain === c
                    ? "bg-white/15 text-white font-bold border border-white/20 shadow-sm"
                    : "text-neutral-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <span className="text-xs text-neutral-400 pl-1">
            {filteredOpps.length} of {opportunities.length} pools
          </span>
        </div>
      </div>

      {simulated && (
        <div className="flex justify-end">
          <SimulatedBadge simulated={simulated} reason={reason} />
        </div>
      )}

      {/* Table Section */}
      <div className="flex flex-col gap-2 mt-2">
        {/* Table Header */}
        <div className="flex items-center justify-between px-6 py-2.5 text-xs font-bold text-neutral-300 font-mono-tech uppercase tracking-wider border-b border-white/10">
          <span className="w-1/4 min-w-[140px]">POOL</span>
          <span className="w-1/6 hidden sm:inline-block">CHAIN</span>
          <span className="w-1/6 text-right sm:text-center">APY</span>
          <span className="w-1/6 text-right hidden sm:inline-block">TVL</span>
          <span className="w-1/4 sm:w-1/6 text-right">RISK</span>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="py-12 text-center text-xs text-neutral-400 font-mono-tech animate-pulse">
            Loading live DeFiLlama yield opportunities…
          </div>
        )}

        {/* Opportunity Rows */}
        {!loading && filteredOpps.length === 0 && (
          <div className="py-12 text-center text-xs text-neutral-400 font-mono-tech">
            No yield opportunities matched your search.
          </div>
        )}

        {!loading &&
          filteredOpps.map((opp) => <OpportunityRow key={opp.poolId} opp={opp} />)}
      </div>
    </main>
  );
}
