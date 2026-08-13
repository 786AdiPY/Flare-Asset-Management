"use client";

import { useState } from "react";
import type { IntentResponse, Recommendation } from "@/lib/types";
import { SimulatedBadge } from "./SimulatedBadge";

const RISK_BADGE: Record<string, string> = {
  low: "bg-success/15 text-success border-success/40",
  medium: "bg-warn/15 text-warn border-warn/40",
  high: "bg-danger/15 text-danger border-danger/40",
};

interface RecommendationCardProps {
  result: IntentResponse;
  onSelectStrategy?: (rec: Recommendation) => void;
}

function formatTvlUsd(tvlUsd?: number | null): string {
  if (tvlUsd == null) return "$—";
  if (tvlUsd >= 1_000_000) return `$${(tvlUsd / 1_000_000).toFixed(1)}M`;
  if (tvlUsd >= 1_000) return `$${(tvlUsd / 1_000).toFixed(0)}K`;
  return `$${tvlUsd.toFixed(0)}`;
}

function StrategyCard({
  rec,
  isTopPick,
  onSelect,
}: {
  rec: Recommendation;
  isTopPick: boolean;
  onSelect?: (rec: Recommendation) => void;
}) {
  const [showSteps, setShowSteps] = useState(false);
  const [showWhyThis, setShowWhyThis] = useState(false);
  const [showDataSources, setShowDataSources] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedTvl = formatTvlUsd(rec.verifiedData?.verifiedTvlUsd);

  const formattedRoute =
    rec.verifiedData?.verifiedRoute ||
    (rec.fromToken && rec.toToken
      ? `${rec.fromToken} → ${rec.fromToken !== "WFLR" && rec.fromToken !== "FLR" ? "WFLR → " : ""}${rec.toToken}`
      : `FLR → ${rec.protocol}`);

  const handleCopy = () => {
    const text = `OPTION #${rec.rank}: ${rec.strategy}\nChain: ${rec.chain} · ${rec.protocol}\nRoute: ${formattedRoute}\nEstimated APY: ${rec.estimatedApy ?? "N/A"}%`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group relative flex flex-col gap-4 rounded-2xl border p-6 transition-all ${
        isTopPick
          ? "border-accent/50 bg-gradient-to-br from-[#161622]/90 to-[#121217]/90 shadow-glow"
          : "border-white/10 bg-[#121217]/70 hover:border-accent/40"
      }`}
    >
      {/* Top Bar: OPTION # (left) + BADGE / RISK / COPY (right) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono-tech text-xs font-bold text-neutral-400 uppercase tracking-widest">
            OPTION #{rec.rank}
          </span>
          {rec.badgeTag && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide font-mono-tech ${
                rec.badgeTag === "Best Match"
                  ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-sm"
                  : "bg-accent/20 border border-accent/40 text-accent2"
              }`}
            >
              {rec.badgeTag === "Best Match" ? "★ Best Match" : rec.badgeTag}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wider font-mono-tech ${
              RISK_BADGE[rec.riskLevel]
            }`}
          >
            {rec.riskLevel.toUpperCase()} RISK
          </span>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy strategy summary"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            {copied ? (
              <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Title & Subtitle */}
      <div>
        <h3 className="text-xl font-bold text-white group-hover:text-accent2 transition-colors">
          {rec.strategy}
        </h3>
        <p className="text-xs text-neutral-400 font-mono-tech mt-1">
          {rec.chain} · {rec.protocol}
        </p>
      </div>

      {/* Metrics Row: APY | TVL | Fee | Risk */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-white/10 bg-[#09090c]/70 px-4 py-3 text-xs font-mono-tech text-neutral-300">
        <div>
          <span className="text-neutral-400">APY </span>
          <strong className="text-success font-extrabold text-sm">
            {rec.estimatedApy != null ? `${rec.estimatedApy.toFixed(2)}%` : "—"}
          </strong>
        </div>
        <div>
          <span className="text-neutral-400">TVL </span>
          <strong className="text-white font-semibold">{formattedTvl}</strong>
        </div>
        <div>
          <span className="text-neutral-400">Fee </span>
          <strong className="text-white font-semibold">
            {rec.estimatedFeesPct != null ? `${rec.estimatedFeesPct}%` : "0.3%"}
          </strong>
        </div>
        <div>
          <span className="text-neutral-400">Risk </span>
          <strong
            className={`font-semibold uppercase ${
              rec.riskLevel === "low"
                ? "text-success"
                : rec.riskLevel === "medium"
                ? "text-warn"
                : "text-danger"
            }`}
          >
            {rec.riskLevel} RISK
          </strong>
        </div>
      </div>

      {/* Why This Option? Section */}
      <div className="flex flex-col gap-2 rounded-xl border border-accent/20 bg-accent/5 p-4">
        <div className="flex items-center gap-2">
          <span className="text-accent text-sm">⚡</span>
          <span className="text-xs font-bold text-accent font-mono-tech uppercase tracking-wider">
            Why this option?
          </span>
        </div>

        {/* Evidence Checkmarks */}
        {rec.evidence && rec.evidence.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1">
            {rec.evidence.map((ev, idx) => (
              <span
                key={idx}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 font-mono-tech"
              >
                {ev}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-neutral-300 leading-relaxed mt-1">{rec.explanation}</p>
      </div>

      {/* Interactive Meta Row: [Compare ranking] and [Data sources] */}
      <div className="flex flex-wrap items-center gap-3 pt-0.5">
        <button
          type="button"
          onClick={() => setShowWhyThis(!showWhyThis)}
          className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white font-mono-tech transition-colors"
        >
          <span className="underline underline-offset-4 decoration-neutral-500 hover:decoration-white font-medium">
            Compare ranking
          </span>
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${showWhyThis ? "rotate-180 text-accent2" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <span className="text-neutral-600">·</span>

        <button
          type="button"
          onClick={() => setShowDataSources(!showDataSources)}
          className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white font-mono-tech transition-colors"
        >
          <span className="underline underline-offset-4 decoration-neutral-500 hover:decoration-white font-medium flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse inline-block" />
            Data sources
          </span>
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${showDataSources ? "rotate-180 text-success" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Compare ranking Expandable Panel */}
      {showWhyThis && (
        <div className="border-l-2 border-accent bg-accent/5 pl-4 py-2.5 pr-3 rounded-r-xl transition-all animate-fadeIn">
          <h4 className="text-xs font-bold text-white font-mono-tech">
            Ranking score comparison #{rec.rank}:
          </h4>
          <p className="text-xs text-neutral-300 mt-1 leading-relaxed font-sans">
            {rec.comparisonNote || "Top pick evaluated best against target APY, risk tolerance, and route complexity."}
          </p>
        </div>
      )}

      {/* Data sources Expandable Panel */}
      {showDataSources && (
        <div className="border-l-2 border-success bg-success/5 pl-4 py-2.5 pr-3 rounded-r-xl transition-all animate-fadeIn">
          <h4 className="text-xs font-bold text-white font-mono-tech">
            Verified against
          </h4>
          <ul className="mt-2 space-y-1 text-xs text-neutral-300 font-mono-tech">
            <li className="flex items-center gap-2">
              <span className="text-neutral-500">•</span>
              <span>Flare FTSOv2 — price</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-neutral-500">•</span>
              <span>DeFiLlama — APY / TVL</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-neutral-500">•</span>
              <span>LI.FI — route / fees</span>
            </li>
          </ul>
        </div>
      )}

      {/* Route Section */}
      <div className="flex flex-col gap-1 pt-1">
        <span className="text-xs font-bold text-neutral-400 font-mono-tech uppercase tracking-wider">
          Route
        </span>
        <p className="text-xs font-mono-tech text-accent2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 w-fit">
          {formattedRoute}
        </p>
      </div>

      {/* Action Buttons Row: [View execution steps] & [Select Route & Execute →] */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 mt-1">
        <button
          type="button"
          onClick={() => setShowSteps(!showSteps)}
          className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-neutral-200 transition-all hover:border-accent/40 hover:bg-white/10 hover:text-white"
        >
          <span>{showSteps ? "Hide execution steps" : "View execution steps"}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${showSteps ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onSelect?.(rec)}
          className="lifi-btn-primary px-5 py-2.5 text-xs font-bold shadow-md"
        >
          Select Route &amp; Execute →
        </button>
      </div>

      {/* Collapsible Execution Steps Section */}
      {showSteps && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-[#09090c]/90 p-4 transition-all animate-fadeIn mt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono-tech">
            Execution Steps:
          </span>
          <div className="flex flex-col gap-2 font-mono-tech text-xs">
            {rec.steps.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-3 text-neutral-200 hover:border-accent/30 transition-colors"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent/20 text-accent2 text-xs font-bold font-mono-tech">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-snug">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RecommendationCard({ result, onSelectStrategy }: RecommendationCardProps) {
  const { recommendations, context, goalProfile, simulated, simulationReason } = result;

  if (!recommendations || recommendations.length === 0) return null;

  const hasGoalChips =
    goalProfile &&
    (goalProfile.targetApy ||
      goalProfile.riskTolerance ||
      goalProfile.objective ||
      goalProfile.preferredChain ||
      goalProfile.asset);

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-[#121217]/80 backdrop-blur-xl p-6 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Goal-Aware Strategy Recommendations</h2>
          <p className="text-xs text-neutral-400">
            Ranked deterministically by goal fit score · Select a strategy card to preview route &amp; execute
          </p>
        </div>
        <SimulatedBadge simulated={simulated} reason={simulationReason} />
      </div>

      {/* Parsed Goal Profile Chips */}
      {hasGoalChips && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-mono-tech">
          <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
            Parsed Goal Profile:
          </span>
          {goalProfile.asset && (
            <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-white">
              Asset: {goalProfile.asset}
            </span>
          )}
          {goalProfile.targetApy && (
            <span className="rounded-md border border-accent/40 bg-accent/15 px-2 py-0.5 text-accent font-bold">
              Target APY: ≥{goalProfile.targetApy}%
            </span>
          )}
          {goalProfile.riskTolerance && (
            <span className="rounded-md border border-amber/40 bg-amber/15 px-2 py-0.5 text-amber">
              Risk: {goalProfile.riskTolerance}
            </span>
          )}
          {goalProfile.objective && (
            <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-neutral-200">
              Goal: {goalProfile.objective}
            </span>
          )}
          {goalProfile.preferredChain && (
            <span className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-emerald-400">
              Chain: {goalProfile.preferredChain}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {recommendations.map((rec, i) => (
          <StrategyCard
            key={rec.rank || i}
            rec={rec}
            isTopPick={i === 0}
            onSelect={onSelectStrategy}
          />
        ))}
      </div>

      <details className="text-xs text-neutral-500">
        <summary className="cursor-pointer text-neutral-400 hover:text-white font-mono-tech">
          Context used ({context.topYields.length} yield opportunities, {context.prices.length} price feeds)
        </summary>
        <div className="mt-2 space-y-1 font-mono-tech">
          {context.topYields.map((y) => (
            <div key={y.poolId}>
              {y.project} · {y.symbol} · {y.chain} · APY {y.apy?.toFixed(2) ?? "—"}%
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

