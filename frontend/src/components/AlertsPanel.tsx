"use client";

import { useEffect, useState } from "react";
import { getAlerts } from "@/lib/api";
import { useWalletContext } from "@/lib/walletContext";
import type { OpportunityAlert } from "@/lib/types";

interface DisplayAlert {
  id: string;
  asset: string;
  protocol: string;
  chain: string;
  riskLevel: "Low Risk" | "Medium Risk" | "High Risk";
  timestamp: string;
  explanation: string;
  improvementApy: number;
  currentApy: number;
  targetApy: number;
  opportunityApy: number;
}

const SAMPLE_ALERTS: DisplayAlert[] = [
  {
    id: "alert-1",
    asset: "USDC",
    protocol: "Kinetic · Flare",
    chain: "Flare",
    riskLevel: "Low Risk",
    timestamp: "4 minutes ago",
    explanation:
      "Your current position yields 3.20%. A new 8.42% opportunity now meets your 5.20% target while remaining within your low-risk preference.",
    improvementApy: 5.22,
    currentApy: 3.2,
    targetApy: 5.2,
    opportunityApy: 8.42,
  },
  {
    id: "alert-2",
    asset: "XRP",
    protocol: "Enosys · Flare",
    chain: "Flare",
    riskLevel: "Medium Risk",
    timestamp: "1 hour ago",
    explanation:
      "Your XRP is unallocated. Minting FXRP unlocks a 9.74% vault that clears your 6.00% target at medium risk, with no lockup.",
    improvementApy: 9.74,
    currentApy: 0.0,
    targetApy: 6.0,
    opportunityApy: 9.74,
  },
  {
    id: "alert-3",
    asset: "FLR",
    protocol: "Firelight · Flare",
    chain: "Flare",
    riskLevel: "Medium Risk",
    timestamp: "3 hours ago",
    explanation:
      "Detected 5,000 unallocated FLR. Liquid staking at 11.36% clears your 8.00% target and stays withdrawable.",
    improvementApy: 11.36,
    currentApy: 0.0,
    targetApy: 8.0,
    opportunityApy: 11.36,
  },
];

export function AlertsPanel({ refreshToken = 0 }: { refreshToken?: number }) {
  const { walletAddress } = useWalletContext();
  const [alerts, setAlerts] = useState<DisplayAlert[]>(SAMPLE_ALERTS);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  function handleDismiss(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  const activeAlerts = alerts.filter((a) => !dismissed.has(a.id));

  return (
    <div className="flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
            Goal-matched opportunities
          </h2>
          <span className="text-xs sm:text-sm text-neutral-400 font-mono-tech">
            Only raised when a new pool materially clears your stated target inside your risk band.
          </span>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono-tech text-neutral-400 shrink-0">
          {activeAlerts.length} open
        </span>
      </div>

      {/* Alert Cards List */}
      <div className="flex flex-col gap-4">
        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-2xl border border-white/10 bg-[#0B0F12]/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl flex flex-col gap-4 font-mono-tech"
          >
            {/* Top row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
                  {alert.asset}
                </span>
                <span className="text-xs text-neutral-400 font-medium">{alert.protocol}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    alert.riskLevel === "Low Risk"
                      ? "border border-success/30 bg-success/15 text-success"
                      : alert.riskLevel === "Medium Risk"
                      ? "border border-accent2/30 bg-accent2/15 text-accent2"
                      : "border border-warn/30 bg-warn/15 text-warn"
                  }`}
                >
                  {alert.riskLevel}
                </span>
              </div>
              <span className="text-xs text-neutral-500">{alert.timestamp}</span>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 items-center">
              {/* Left Column */}
              <div className="flex flex-col gap-4">
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans font-medium">
                  {alert.explanation}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("holdings-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="rounded-xl bg-[#B2C8BA] px-5 py-2.5 text-xs sm:text-sm font-mono-tech font-bold text-[#0B0F12] shadow-lg hover:bg-[#C4D8CA] transition-all hover:scale-105"
                  >
                    Route this position →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismiss(alert.id)}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-mono-tech font-medium text-neutral-300 hover:text-white hover:border-white/30 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Right Column (Metric box) */}
              <div className="rounded-xl border border-white/10 bg-[#07090c] p-4 flex flex-col gap-2.5">
                <div className="text-xs text-neutral-400 font-semibold tracking-wider uppercase font-mono-tech">
                  APY Improvement
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-success">
                  +{alert.improvementApy.toFixed(2)}pp
                </div>

                <div className="border-t border-white/10 pt-2 flex flex-col gap-1 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Current</span>
                    <span className="text-white font-medium">{alert.currentApy.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Your target</span>
                    <span className="text-white font-medium">{alert.targetApy.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Opportunity</span>
                    <span className="text-success font-bold">{alert.opportunityApy.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
