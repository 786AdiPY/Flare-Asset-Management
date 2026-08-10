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
    return <div className="text-xs text-danger">Price feed unavailable: {error}</div>;
  }

  if (feeds.length === 0) {
    return <div className="text-xs text-neutral-400 animate-pulse">Loading live Flare FTSOv2 price feeds…</div>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {feeds.map((f) => (
        <div
          key={f.symbol}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md hover:border-accent/40 transition-all"
        >
          <span className="text-xs font-semibold text-neutral-300">{f.symbol}</span>
          <span className="font-mono-tech text-xs font-bold text-white">
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
