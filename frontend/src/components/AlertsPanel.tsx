"use client";

import { useEffect, useState } from "react";
import { getAlerts } from "@/lib/api";
import type { OpportunityAlert } from "@/lib/types";
import { SimulatedBadge } from "./SimulatedBadge";

const SEVERITY_BORDER: Record<string, string> = {
  info: "border-border",
  notable: "border-accent2",
  high: "border-warn",
};

export function AlertsPanel({
  walletAddress,
  refreshToken = 0,
}: {
  walletAddress: string | null;
  refreshToken?: number;
}) {
  const [alerts, setAlerts] = useState<OpportunityAlert[]>([]);
  const [simulated, setSimulated] = useState(false);
  const [reason, setReason] = useState<string | null | undefined>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await getAlerts(walletAddress);
        if (!cancelled) {
          setAlerts(res.alerts);
          setSimulated(res.simulated);
          setReason(res.simulationReason);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load alerts");
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [walletAddress, refreshToken]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Smart Opportunity Alerts</h3>
        <SimulatedBadge simulated={simulated} reason={reason} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {!error && alerts.length === 0 && (
        <p className="text-sm text-neutral-500">
          No better opportunities right now for {walletAddress ? "your saved holdings" : "the demo portfolio"}.
        </p>
      )}

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-lg border-l-2 ${SEVERITY_BORDER[alert.severity]} bg-ink/60 p-3`}
        >
          <p className="text-sm font-medium">{alert.title}</p>
          <p className="text-xs text-neutral-400">
            {alert.currentApy}% → {alert.betterApy}% via {alert.protocol} on {alert.chain} (+
            {alert.apyDeltaPct} pts)
          </p>
          <p className="mt-1 text-xs text-neutral-500">{alert.explanation}</p>
        </div>
      ))}
    </div>
  );
}
