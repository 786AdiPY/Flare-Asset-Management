import type { IntentResponse } from "@/lib/types";
import { SimulatedBadge } from "./SimulatedBadge";

const RISK_COLOR: Record<string, string> = {
  low: "text-accent",
  medium: "text-warn",
  high: "text-danger",
};

export function RecommendationCard({ result }: { result: IntentResponse }) {
  const { recommendation, context, simulated, simulationReason } = result;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{recommendation.strategy}</h3>
        <SimulatedBadge simulated={simulated} reason={simulationReason} />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-400">
        <span>
          Chain: <strong className="text-neutral-200">{recommendation.chain}</strong>
        </span>
        <span>
          Protocol: <strong className="text-neutral-200">{recommendation.protocol}</strong>
        </span>
        <span>
          Est. APY:{" "}
          <strong className="text-neutral-200">
            {recommendation.estimatedApy != null ? `${recommendation.estimatedApy.toFixed(2)}%` : "—"}
          </strong>
        </span>
        <span>
          Fees:{" "}
          <strong className="text-neutral-200">
            {recommendation.estimatedFeesPct != null ? `${recommendation.estimatedFeesPct}%` : "—"}
          </strong>
        </span>
        <span>
          Risk:{" "}
          <strong className={RISK_COLOR[recommendation.riskLevel]}>{recommendation.riskLevel}</strong>
        </span>
      </div>

      <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-300">
        {recommendation.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>

      <p className="text-sm text-neutral-400">{recommendation.explanation}</p>

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
