"use client";

import { useEffect, useState } from "react";
import { getYieldHistory, getYields } from "@/lib/api";
import type { YieldHistoryPoint, YieldOpportunity } from "@/lib/types";
import { SimulatedBadge } from "@/components/SimulatedBadge";
import { Sparkline } from "@/components/Sparkline";

function OpportunityRow({ opp }: { opp: YieldOpportunity }) {
  const [history, setHistory] = useState<YieldHistoryPoint[] | null>(null);
  const [historySimulated, setHistorySimulated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

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

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121217]/80 backdrop-blur-xl p-5 shadow-lg hover:border-accent/40 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-base font-bold text-white">
            {opp.project} <span className="text-neutral-400 font-mono-tech">· {opp.symbol}</span>
          </p>
          <p className="text-xs text-neutral-400 font-mono-tech mt-0.5">
            {opp.chain} · TVL ${opp.tvlUsd ? (opp.tvlUsd / 1_000_000).toFixed(2) : "0"}M
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xl font-black text-success font-mono-tech">
            {opp.apy != null ? `${opp.apy.toFixed(2)}%` : "—"}
          </span>
          <button
            type="button"
            onClick={toggle}
            className="lifi-btn-secondary px-3 py-1.5 text-xs font-semibold"
          >
            {open ? "Hide" : "30d history"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 border-t border-white/10 pt-4">
          {loading && <p className="text-xs text-neutral-400 animate-pulse font-mono-tech">Loading history…</p>}
          {!loading && history && history.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1">
                <Sparkline points={history.map((p) => ({ date: p.date, value: p.apy }))} />
              </div>
              <SimulatedBadge simulated={historySimulated} reason={historySimulated ? "No live DeFiLlama chart data for this pool" : null} />
            </div>
          )}
          {!loading && history && history.length === 0 && (
            <p className="text-xs text-neutral-400 font-mono-tech">No history available for this pool.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function YieldsPage() {
  const [keywords, setKeywords] = useState("");
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

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-white font-display">
          Yield <span className="lifi-text-gradient">Explorer</span>
        </h1>
        <p className="text-sm text-neutral-400 font-medium">
          Live DeFiLlama opportunities with 30-day APY/TVL historical sparklines.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Filter by symbol, e.g. USDC, FLR, GOLD"
          className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121217]/90 px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-accent"
        />
        <SimulatedBadge simulated={simulated} reason={reason} />
      </div>

      {loading && <p className="text-xs text-neutral-400 font-mono-tech animate-pulse">Loading opportunities…</p>}

      <div className="flex flex-col gap-4">
        {!loading && opportunities.length === 0 && (
          <p className="text-xs text-neutral-400 font-mono-tech">No opportunities matched.</p>
        )}
        {opportunities.map((opp) => (
          <OpportunityRow key={opp.poolId} opp={opp} />
        ))}
      </div>
    </main>
  );
}
