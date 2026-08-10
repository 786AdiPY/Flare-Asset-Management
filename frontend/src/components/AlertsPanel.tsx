"use client";

import { useEffect, useState } from "react";
import { getAlerts } from "@/lib/api";
import { useWalletContext } from "@/lib/walletContext";
import type { OpportunityAlert } from "@/lib/types";
import { SimulatedBadge } from "./SimulatedBadge";

const SEVERITY_BORDER: Record<string, string> = {
  info: "border-white/10",
  notable: "border-accent2",
  high: "border-warn",
};

export function AlertsPanel({ refreshToken = 0 }: { refreshToken?: number }) {
  const { walletAddress } = useWalletContext();
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
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#121217]/80 backdrop-blur-xl p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Smart Opportunity Alerts</h3>
        <SimulatedBadge simulated={simulated} reason={reason} />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {!error && alerts.length === 0 && (
        <p className="text-xs text-neutral-400">
          No higher yield opportunities detected for {walletAddress ? "your portfolio holdings" : "the demo holdings"}.
        </p>
      )}

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-xl border-l-4 ${SEVERITY_BORDER[alert.severity]} bg-[#09090c] p-4 flex flex-col gap-1.5 shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">{alert.title}</p>
            <span className="text-xs font-mono-tech text-success font-bold">
              +{alert.apyDeltaPct} pts APY
            </span>
          </div>
          <p className="text-xs text-neutral-300 font-mono-tech">
            {alert.currentApy}% → {alert.betterApy}% via {alert.protocol} on {alert.chain}
          </p>
          <p className="text-xs text-neutral-400 leading-relaxed">{alert.explanation}</p>
        </div>
      ))}
    </div>
  );
}
