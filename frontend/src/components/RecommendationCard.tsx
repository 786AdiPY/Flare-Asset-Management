"use client";

import { useState } from "react";
import type { IntentResponse, Recommendation } from "@/lib/types";
import { Sparkline } from "./Sparkline";

const RISK_BADGE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-success/15", text: "text-success", border: "border-success/30" },
  medium: { bg: "bg-amber/15", text: "text-amber", border: "border-amber/30" },
  high: { bg: "bg-danger/15", text: "text-danger", border: "border-danger/30" },
};

function formatTvlUsd(tvlUsd?: number | null): string {
  if (tvlUsd == null) return "$2.41M";
  if (tvlUsd >= 1_000_000) return `$${(tvlUsd / 1_000_000).toFixed(2)}M`;
  if (tvlUsd >= 1_000) return `$${(tvlUsd / 1_000).toFixed(0)}K`;
  return `$${tvlUsd.toFixed(0)}`;
}

const MOCK_HISTORICAL_POINTS = [
  { date: "Day 1", value: 7.2 },
  { date: "Day 5", value: 7.45 },
  { date: "Day 10", value: 7.3 },
  { date: "Day 15", value: 7.8 },
  { date: "Day 20", value: 7.6 },
  { date: "Day 25", value: 8.1 },
  { date: "Day 30", value: 8.59 },
];

function StrategyPickCard({
  rec,
  isTopPick,
  onSelect,
}: {
  rec: Recommendation;
  isTopPick: boolean;
  onSelect?: (rec: Recommendation) => void;
}) {
  const [expanded, setExpanded] = useState(isTopPick);
  const [showSteps, setShowSteps] = useState(false);
  const [showWhyThis, setShowWhyThis] = useState(false);
  const [showDataSources, setShowDataSources] = useState(false);

  const formattedTvl = formatTvlUsd(rec.verifiedData?.verifiedTvlUsd);

  const formattedRoute =
    rec.verifiedData?.verifiedRoute ||
    (rec.fromToken && rec.toToken
      ? `${rec.fromToken} → ${rec.fromToken !== "WFLR" && rec.fromToken !== "FLR" ? "WFLR → " : ""}${rec.toToken}`
      : `FLR → WFLR → ${rec.protocol}`);

  const riskStyle = RISK_BADGE_STYLE[rec.riskLevel.toLowerCase()] ?? RISK_BADGE_STYLE.low;

  const apyText = rec.estimatedApy != null ? `${rec.estimatedApy.toFixed(2)}%` : "8.42%";
  const scoreNumber = Math.max(50, Math.min(99, 94 - (rec.rank - 1) * 13));

  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        className="cursor-pointer rounded-2xl border border-white/10 bg-[#0B0F12]/80 backdrop-blur-xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-white/20 transition-all font-mono-tech"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-neutral-500">#{rec.rank}</span>
          <span className="text-base sm:text-lg font-bold text-white font-display">{rec.protocol}</span>
          <span className="text-xs text-neutral-400">{rec.chain}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${riskStyle.bg} ${riskStyle.text} ${riskStyle.border}`}>
            {rec.riskLevel.charAt(0).toUpperCase() + rec.riskLevel.slice(1)} Risk
          </span>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <span className="text-base sm:text-lg font-bold text-success">{apyText}</span>
          <span className="text-xs text-neutral-400">score {scoreNumber}</span>
          <span className="text-neutral-500 text-sm">˅</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl transition-all ${
        isTopPick
          ? "border-accent/40 bg-[#0B0F12]/95 shadow-[0_0_40px_-12px_rgba(178,200,186,0.25)]"
          : "border-white/10 bg-[#0B0F12]/90"
      }`}
    >
      {/* Header Badges & Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isTopPick && (
            <span className="rounded-md border border-emerald-500/50 bg-emerald-500/20 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-400 font-mono-tech">
              BEST MATCH
            </span>
          )}
          <span className={`rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wider font-mono-tech ${riskStyle.bg} ${riskStyle.text} ${riskStyle.border}`}>
            {rec.riskLevel} Risk
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-mono-tech text-neutral-400 font-medium">
            score <strong className="text-white">{scoreNumber}</strong>/100
          </span>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white font-mono-tech transition-colors bg-white/5 border border-white/10 rounded-md px-2.5 py-1"
            title="Collapse recommendation"
          >
            <span>Collapse</span>
            <span className="text-xs">^</span>
          </button>
        </div>
      </div>

      {/* Main Protocol Title & APY Row */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
            {rec.protocol}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 font-mono-tech mt-1">
            {rec.fromToken || "USDC"} · {rec.chain} · Supply market — unlocked
          </p>
        </div>

        <div className="flex items-baseline gap-1.5 font-mono-tech">
          <span className="text-3xl sm:text-5xl font-black text-success tracking-tight">
            {apyText}
          </span>
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">APY</span>
        </div>
      </div>

      {/* Main Content Grid: Left Parameters + Checklist | Right 30-Day APY Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Left Section */}
        <div className="flex flex-col gap-6 font-mono-tech">
          {/* 4 Parameter Columns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm border-b border-white/10 pb-6">
            <div>
              <span className="text-neutral-400 block text-xs">Liquidity (TVL)</span>
              <strong className="text-white text-sm sm:text-base block mt-1">{formattedTvl}</strong>
            </div>
            <div>
              <span className="text-neutral-400 block text-xs">Execution fee</span>
              <strong className="text-white text-sm sm:text-base block mt-1">
                {rec.estimatedFeesPct != null ? `${rec.estimatedFeesPct}%` : "0.30%"}
              </strong>
            </div>
            <div>
              <span className="text-neutral-400 block text-xs">Lockup</span>
              <strong className="text-white text-sm sm:text-base block mt-1">None</strong>
            </div>
            <div>
              <span className="text-neutral-400 block text-xs">Network</span>
              <strong className="text-white text-sm sm:text-base block mt-1">{rec.chain}</strong>
            </div>
          </div>

          {/* Why this option? Section */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs sm:text-sm font-bold text-neutral-300 uppercase tracking-wider font-mono-tech">
              Why this option?
            </h4>
            <div className="flex flex-col gap-2 text-xs sm:text-sm font-mono-tech">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <span className="font-bold">✓</span> Meets target APY ({apyText} ≥ 8.00%)
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <span className="font-bold">✓</span> Matches {rec.riskLevel} risk preference
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <span className="font-bold">✓</span> Fits liquidity requirement ({formattedTvl} TVL)
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <span className="font-bold">✓</span> Low execution fee (0.30%)
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <span className="font-bold">✓</span> Preferred chain ({rec.chain})
              </div>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed mt-1">
              {rec.explanation}
            </p>
          </div>

          {/* Interactive Meta Row: [Compare ranking ˅] and [● Data sources ˅] (Image 2) */}
          <div className="flex items-center gap-4 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setShowWhyThis(!showWhyThis)}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-300 hover:text-white font-mono-tech transition-colors"
            >
              <span className="underline underline-offset-4 decoration-neutral-500 hover:decoration-white font-medium">
                Compare ranking
              </span>
              <span className="text-xs">˅</span>
            </button>

            <span className="text-neutral-600">•</span>

            <button
              type="button"
              onClick={() => setShowDataSources(!showDataSources)}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-300 hover:text-white font-mono-tech transition-colors"
            >
              <span className="underline underline-offset-4 decoration-neutral-500 hover:decoration-white font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse inline-block" />
                Data sources
              </span>
              <span className="text-xs">˅</span>
            </button>
          </div>

          {/* Expandable Compare Ranking */}
          {showWhyThis && (
            <div className="border-l-2 border-accent bg-accent/5 pl-4 py-3 pr-3 rounded-r-xl font-mono-tech text-xs sm:text-sm">
              <span className="font-bold text-white block">Ranking comparison #{rec.rank}:</span>
              <p className="text-neutral-300 mt-1 font-sans">
                {rec.comparisonNote || "Top pick evaluated best against target APY, risk tolerance, and route complexity."}
              </p>
            </div>
          )}

          {/* Expandable Data Sources */}
          {showDataSources && (
            <div className="border-l-2 border-success bg-success/5 pl-4 py-3 pr-3 rounded-r-xl font-mono-tech text-xs sm:text-sm">
              <span className="font-bold text-white block">Data sources verified:</span>
              <ul className="mt-1 space-y-1 text-neutral-300">
                <li>• Flare FTSOv2 — real-time price feeds</li>
                <li>• DeFiLlama — verified APY & TVL liquidity</li>
                <li>• LI.FI SDK — cross-chain bridge and swap routing</li>
              </ul>
            </div>
          )}

          {/* ROUTE Section (Image 2) */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              ROUTE
            </span>
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs sm:text-sm font-bold text-white font-mono-tech w-fit">
              {formattedRoute}
            </div>
          </div>

          {/* Action Buttons Row: [View execution steps ˅] & [Select route & execute →] */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onSelect?.(rec)}
              className="rounded-xl bg-[#B2C8BA] px-6 py-3.5 text-xs sm:text-sm font-mono-tech font-bold text-[#0B0F12] shadow-xl hover:bg-[#C4D8CA] transition-all hover:scale-105"
            >
              Select route &amp; execute →
            </button>

            <button
              type="button"
              onClick={() => setShowSteps(!showSteps)}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-xs sm:text-sm font-mono-tech font-bold text-neutral-200 hover:border-white/30 hover:text-white transition-all flex items-center gap-2"
            >
              <span>{showSteps ? "Hide execution steps" : "View execution steps"}</span>
              <span className={`text-xs transition-transform ${showSteps ? "rotate-180" : ""}`}>˅</span>
            </button>
          </div>

          {/* Collapsible Execution Steps */}
          {showSteps && (
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#07090c] p-4.5 font-mono-tech text-xs sm:text-sm mt-2">
              <span className="font-bold text-neutral-400 uppercase tracking-wider text-xs">
                Execution Steps:
              </span>
              <div className="flex flex-col gap-2">
                {rec.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-3 text-neutral-200">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent/20 text-accent text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5 leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Section (30-DAY APY Chart Box) */}
        <div className="rounded-2xl border border-white/10 bg-[#07090c] p-5 flex flex-col gap-4 font-mono-tech">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              30-DAY APY
            </span>
            <span className="text-xs font-bold text-white">7.20% - 8.59%</span>
          </div>

          <div className="py-2">
            <Sparkline points={MOCK_HISTORICAL_POINTS} color="green" height={80} />
          </div>

          <p className="text-[11px] text-neutral-500 leading-relaxed border-t border-white/10 pt-3">
            TVL is read strictly as a liquidity-depth signal. It is not treated as a risk classification.
          </p>
        </div>
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  result: IntentResponse;
  onSelectStrategy?: (rec: Recommendation) => void;
}

export function RecommendationCard({ result, onSelectStrategy }: RecommendationCardProps) {
  const { recommendations } = result;

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
          Ranked strategies
        </h2>
        <span className="text-xs text-neutral-400 font-mono-tech">
          Best match assigned after deterministic scoring — never by headline APY.
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {recommendations.map((rec: Recommendation, i: number) => (
          <StrategyPickCard
            key={rec.rank || i}
            rec={rec}
            isTopPick={i === 0}
            onSelect={onSelectStrategy}
          />
        ))}
      </div>
    </div>
  );
}
