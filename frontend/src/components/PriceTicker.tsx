"use client";

import { useEffect, useState } from "react";
import { getPrices } from "@/lib/api";
import type { FeedValue } from "@/lib/types";
import { SimulatedBadge } from "./SimulatedBadge";

export function PriceTicker() {
  const [feeds, setFeeds] = useState<FeedValue[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await getPrices();
        if (!cancelled) setFeeds(res.feeds);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load prices");
      }
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (error) {
    return <div className="text-sm text-danger">Price feed unavailable: {error}</div>;
  }

  if (feeds.length === 0) {
    return <div className="text-sm text-neutral-500">Loading Flare FTSO feeds…</div>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {feeds.map((f) => (
        <div
          key={f.symbol}
          className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2"
        >
          <span className="text-sm text-neutral-400">{f.symbol}</span>
          <span className="font-mono text-sm">
            {f.value != null
              ? `$${f.value.toLocaleString(undefined, { maximumFractionDigits: 4 })}`
              : "—"}
          </span>
          <SimulatedBadge simulated={f.simulated} reason={f.simulationReason} />
        </div>
      ))}
    </div>
  );
}
