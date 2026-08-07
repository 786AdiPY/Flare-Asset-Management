import type { IntentResponse, Recommendation } from "@/lib/types";
import { SimulatedBadge } from "./SimulatedBadge";

const RISK_COLOR: Record<string, string> = {
  low: "text-accent",
  medium: "text-warn",
  high: "text-danger",
};

function TopRecommendation({ rec }: { rec: Recommendation }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">{rec.strategy}</h3>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-400">
        <span>
          Chain: <strong className="text-neutral-200">{rec.chain}</strong>
        </span>
        <span>
          Protocol: <strong className="text-neutral-200">{rec.protocol}</strong>
        </span>
        <span>
          Est. APY:{" "}
          <strong className="text-neutral-200">
            {rec.estimatedApy != null ? `${rec.estimatedApy.toFixed(2)}%` : "—"}
          </strong>
        </span>
        <span>
          Fees:{" "}
          <strong className="text-neutral-200">
            {rec.estimatedFeesPct != null ? `${rec.estimatedFeesPct}%` : "—"}
          </strong>
        </span>
        <span>
          Risk: <strong className={RISK_COLOR[rec.riskLevel]}>{rec.riskLevel}</strong>
        </span>
      </div>

      <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-300">
        {rec.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>

      <p className="text-sm text-neutral-400">{rec.explanation}</p>
    </div>
  );
}

function AlternativeRecommendation({ rec }: { rec: Recommendation }) {
  return (
    <details className="rounded-lg border border-border bg-ink/60 p-3">
      <summary className="cursor-pointer text-sm font-medium text-neutral-300">
        #{rec.rank} — {rec.strategy}{" "}
        <span className={`ml-2 text-xs ${RISK_COLOR[rec.riskLevel]}`}>{rec.riskLevel} risk</span>
        <span className="ml-2 text-xs text-neutral-500">
          {rec.estimatedApy != null ? `${rec.estimatedApy.toFixed(2)}% APY` : ""}
        </span>
      </summary>
      <div className="mt-2 flex flex-col gap-2 text-sm text-neutral-400">
        {rec.comparisonNote && (
          <p className="text-xs text-warn">Why not this one first: {rec.comparisonNote}</p>
        )}
        <ol className="list-decimal space-y-1 pl-5">
          {rec.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <p>{rec.explanation}</p>
      </div>
    </details>
  );
}

export function RecommendationCard({ result }: { result: IntentResponse }) {
  const { recommendations, context, simulated, simulationReason } = result;
  const [top, ...alternatives] = recommendations;

  if (!top) return null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Top pick</span>
        <SimulatedBadge simulated={simulated} reason={simulationReason} />
      </div>

      <TopRecommendation rec={top} />

      {alternatives.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-neutral-500">Other options considered</span>
          {alternatives.map((rec) => (
            <AlternativeRecommendation key={rec.rank} rec={rec} />
          ))}
        </div>
      )}

      <details className="text-xs text-neutral-500">
        <summary className="cursor-pointer text-neutral-400">
          Context used ({context.topYields.length} yield opportunities, {context.prices.length} price
          feeds)
        </summary>
        <div className="mt-2 space-y-1">
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
