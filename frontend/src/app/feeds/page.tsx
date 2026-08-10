"use client";

import { useEffect, useState } from "react";
import { getAllPrices } from "@/lib/api";
import type { FeedValue } from "@/lib/types";
import { SimulatedBadge } from "@/components/SimulatedBadge";

export default function FeedsPage() {
  const [feeds, setFeeds] = useState<FeedValue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getAllPrices()
        .then((res) => {
          if (!cancelled) {
            setFeeds(res.feeds);
            setError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load feeds");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-white font-display">
          Flare FTSO <span className="lifi-text-gradient">Price Feeds</span>
        </h1>
        <p className="text-sm text-neutral-400 font-medium">
          Category-1 on-chain price feeds read directly from Flare FtsoV2 smart contracts.
        </p>
      </div>

      {loading && <p className="text-xs text-neutral-400 font-mono-tech animate-pulse">Loading FTSO feeds…</p>}
      {error && <p className="text-xs text-danger font-mono-tech">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {feeds.map((f) => (
          <div
            key={f.symbol}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#121217]/80 backdrop-blur-xl p-5 shadow-lg hover:border-accent/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{f.symbol}</span>
              <SimulatedBadge simulated={f.simulated} reason={f.simulationReason} />
            </div>
            <span className="font-mono-tech text-2xl font-black text-white">
              {f.value != null ? `$${f.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}` : "—"}
            </span>
            <span className="truncate font-mono-tech text-[10px] text-neutral-500" title={f.feedId}>
              {f.feedId}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
