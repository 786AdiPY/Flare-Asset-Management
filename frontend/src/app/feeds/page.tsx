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
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Flare FTSO Feeds</h1>
        <p className="text-sm text-neutral-400">
          On-chain price feeds read directly from the FtsoV2 contract via <code>getFeedById</code>{" "}
          (Coston2 testnet by default). Any feed that reverts or isn&apos;t resolvable falls back to a
          clearly-labeled simulated value.
        </p>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading feeds…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {feeds.map((f) => (
          <div key={f.symbol} className="flex flex-col gap-2 rounded-xl border border-border bg-panel p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">{f.symbol}</span>
              <SimulatedBadge simulated={f.simulated} reason={f.simulationReason} />
            </div>
            <span className="font-mono text-xl">
              {f.value != null ? `$${f.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}` : "—"}
            </span>
            <span className="truncate text-xs text-neutral-600" title={f.feedId}>
              {f.feedId}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
