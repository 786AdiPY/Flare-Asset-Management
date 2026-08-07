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
    <div className="rounded-lg border border-border bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            {opp.project} <span className="text-neutral-500">· {opp.symbol}</span>
          </p>
          <p className="text-xs text-neutral-500">
            {opp.chain} · TVL ${opp.tvlUsd ? (opp.tvlUsd / 1_000_000).toFixed(2) : "0"}M
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-accent">
            {opp.apy != null ? `${opp.apy.toFixed(2)}%` : "—"}
          </span>
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg border border-border px-2 py-1 text-xs text-neutral-400 hover:border-accent2"
          >
            {open ? "Hide" : "30d history"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 border-t border-border pt-3">
          {loading && <p className="text-xs text-neutral-500">Loading history…</p>}
          {!loading && history && history.length > 0 && (
            <div className="flex items-center gap-2">
              <Sparkline points={history.map((p) => ({ date: p.date, value: p.apy }))} />
              <SimulatedBadge simulated={historySimulated} reason={historySimulated ? "No live DeFiLlama chart data for this pool" : null} />
            </div>
          )}
          {!loading && history && history.length === 0 && (
            <p className="text-xs text-neutral-500">No history available for this pool.</p>
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
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Yield Explorer</h1>
        <p className="text-sm text-neutral-400">
          Live DeFiLlama pools, capped at a believable APY range. Expand any pool for its 30-day
          APY/TVL history — a single high snapshot doesn&apos;t tell you if a rate is stable.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Filter by symbol, e.g. USDC, FLR, GOLD (comma-separated)"
          className="w-full max-w-sm rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent2"
        />
        <SimulatedBadge simulated={simulated} reason={reason} />
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading opportunities…</p>}

      <div className="flex flex-col gap-3">
        {!loading && opportunities.length === 0 && (
          <p className="text-sm text-neutral-500">No opportunities matched.</p>
        )}
        {opportunities.map((opp) => (
          <OpportunityRow key={opp.poolId} opp={opp} />
        ))}
      </div>
    </main>
  );
}
