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

function StrategyCard({
  rec,
  isTopPick,
  onSelect,
}: {
  rec: Recommendation;
  isTopPick: boolean;
  onSelect?: (rec: Recommendation) => void;
}) {
  const badge = rec.badgeTag || (isTopPick ? "Highest Yield" : `Option #${rec.rank}`);

  return (
    <div
      className={`group relative flex flex-col gap-5 rounded-2xl border p-6 transition-all ${
        isTopPick
          ? "border-accent/50 bg-gradient-to-br from-[#161622]/90 to-[#121217]/90 shadow-glow"
          : "border-white/10 bg-[#121217]/70 hover:border-accent/40"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-xs font-bold text-accent2 uppercase tracking-wide">
            {badge}
          </span>
          <span className="text-xs text-neutral-400 font-mono-tech">Rank #{rec.rank}</span>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wider ${RISK_BADGE[rec.riskLevel]}`}>
          {rec.riskLevel.toUpperCase()} RISK
        </span>
      </div>

      <h3 className="text-lg font-bold text-white group-hover:text-accent2 transition-colors">
        {rec.strategy}
      </h3>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-300">
        <span>
          Chain: <strong className="text-white">{rec.chain}</strong>
        </span>
        <span>
          Protocol: <strong className="text-white">{rec.protocol}</strong>
        </span>
        <span>
          Est. APY:{" "}
          <strong className="text-success font-extrabold text-sm">
            {rec.estimatedApy != null ? `${rec.estimatedApy.toFixed(2)}%` : "—"}
          </strong>
        </span>
        <span>
          Fees:{" "}
          <strong className="text-white">
            {rec.estimatedFeesPct != null ? `${rec.estimatedFeesPct}%` : "0.3%"}
          </strong>
        </span>
      </div>

      {rec.comparisonNote && (
        <div className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-warn">
          💡 <strong>Explainable AI Note:</strong> {rec.comparisonNote}
        </div>
      )}

      {rec.verifiedData && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-xs text-success font-mono-tech">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
            <strong className="text-white">AI Guardrail Verified Data:</strong>
            <span>Sources [{rec.verifiedData.sourceAudit.join(", ")}]</span>
          </div>
          <span className="text-[11px] text-neutral-300">
            Validated Route: {rec.verifiedData.verifiedRoute || `${rec.fromToken} → ${rec.toToken}`}
          </span>
        </div>
      )}

      <p className="text-xs text-neutral-300 leading-relaxed">{rec.explanation}</p>

      {/* Horizontal Execution Flow Stages */}
      <div className="flex flex-col gap-2 pt-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono-tech">
          Execution Flow Stages
        </span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
          {rec.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-1 flex-col gap-1 rounded-xl border border-white/10 bg-[#09090c] p-3 transition-all hover:border-accent/40">
                <div className="flex items-center gap-1.5 text-xs font-bold text-accent2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/20 text-[10px] font-mono-tech text-white">
                    {i + 1}
                  </span>
                  <span>Stage {i + 1}</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-snug">{step}</p>
              </div>
              {i < rec.steps.length - 1 && (
                <span className="hidden md:inline-block text-xs font-bold text-neutral-500">➔</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-1">
        <span className="text-[11px] text-neutral-400 font-mono-tech">
          Route: {rec.fromToken || "USDC"} ({rec.fromChain || "Flare"}) → {rec.toToken || rec.protocol} ({rec.chain})
        </span>
        <button
          type="button"
          onClick={() => onSelect?.(rec)}
          className="lifi-btn-primary px-5 py-2 text-xs font-bold shadow-md"
        >
          Select Route & Execute →
        </button>
      </div>
    </div>
  );
}

export function RecommendationCard({ result, onSelectStrategy }: RecommendationCardProps) {
  const { recommendations, context, simulated, simulationReason } = result;

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-[#121217]/80 backdrop-blur-xl p-6 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">AI Strategy Recommendations</h2>
          <p className="text-xs text-neutral-400">
            Select a strategy card below to preview LI.FI route and execute transaction
          </p>
        </div>
        <SimulatedBadge simulated={simulated} reason={simulationReason} />
      </div>

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
