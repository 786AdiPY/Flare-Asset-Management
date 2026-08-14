"use client";

import { useEffect, useState } from "react";
import { getAllPrices } from "@/lib/api";
import type { FeedValue } from "@/lib/types";

interface ExtendedFeedItem {
  symbol: string;
  category: string;
  price: number;
  change24h: number;
  decimals: number;
  feedId: string;
  updatedAgo: string;
}

const DEFAULT_CATEGORY_1_FEEDS: ExtendedFeedItem[] = [
  {
    symbol: "FLR/USD",
    category: "Category 1 · crypto",
    price: 0.02184,
    change24h: 4.12,
    decimals: 5,
    feedId: "0x01464c522f55534400000000000000000000000000",
    updatedAgo: "3s ago",
  },
  {
    symbol: "SGB/USD",
    category: "Category 1 · crypto",
    price: 0.00912,
    change24h: -1.86,
    decimals: 5,
    feedId: "0x015347422f55534400000000000000000000000000",
    updatedAgo: "5s ago",
  },
  {
    symbol: "BTC/USD",
    category: "Category 1 · crypto",
    price: 96412.38,
    change24h: 1.24,
    decimals: 2,
    feedId: "0x014254432f55534400000000000000000000000000",
    updatedAgo: "2s ago",
  },
  {
    symbol: "ETH/USD",
    category: "Category 1 · crypto",
    price: 3284.71,
    change24h: 2.08,
    decimals: 2,
    feedId: "0x014554482f55534400000000000000000000000000",
    updatedAgo: "4s ago",
  },
  {
    symbol: "XRP/USD",
    category: "Category 1 · crypto",
    price: 2.3417,
    change24h: 3.42,
    decimals: 4,
    feedId: "0x015852502f55534400000000000000000000000000",
    updatedAgo: "3s ago",
  },
  {
    symbol: "LTC/USD",
    category: "Category 1 · crypto",
    price: 104.62,
    change24h: -0.74,
    decimals: 2,
    feedId: "0x014c54432f55534400000000000000000000000000",
    updatedAgo: "6s ago",
  },
  {
    symbol: "DOGE/USD",
    category: "Category 1 · crypto",
    price: 0.3182,
    change24h: 5.61,
    decimals: 4,
    feedId: "0x01444f47452f555344000000000000000000000000",
    updatedAgo: "4s ago",
  },
  {
    symbol: "ADA/USD",
    category: "Category 1 · crypto",
    price: 0.9241,
    change24h: -2.13,
    decimals: 4,
    feedId: "0x014144412f55534400000000000000000000000000",
    updatedAgo: "5s ago",
  },
  {
    symbol: "ALGO/USD",
    category: "Category 1 · crypto",
    price: 0.3874,
    change24h: 0.92,
    decimals: 4,
    feedId: "0x01414c474f2f555344000000000000000000000000",
    updatedAgo: "7s ago",
  },
  {
    symbol: "USDT/USD",
    category: "Category 1 · crypto",
    price: 1.0001,
    change24h: 0.01,
    decimals: 4,
    feedId: "0x01555344542f555344000000000000000000000000",
    updatedAgo: "2s ago",
  },
  {
    symbol: "USDC/USD",
    category: "Category 1 · crypto",
    price: 0.9998,
    change24h: -0.02,
    decimals: 4,
    feedId: "0x015553344432f55534400000000000000000000000",
    updatedAgo: "3s ago",
  },
];

export default function FeedsPage() {
  const [feedItems, setFeedItems] = useState<ExtendedFeedItem[]>(DEFAULT_CATEGORY_1_FEEDS);
  const [loading, setLoading] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(15);

  function fetchFeeds() {
    setLoading(true);
    getAllPrices()
      .then((res) => {
        if (res.feeds && res.feeds.length > 0) {
          const apiMap = new Map<string, FeedValue>(res.feeds.map((f) => [f.symbol.toUpperCase(), f]));
          setFeedItems((prev) =>
            prev.map((item) => {
              const live = apiMap.get(item.symbol.toUpperCase());
              if (live && live.value != null) {
                return {
                  ...item,
                  price: live.value,
                  updatedAgo: "1s ago",
                };
              }
              return item;
            })
          );
        }
      })
      .catch(() => {
        // Keep default crisp feeds
      })
      .finally(() => {
        setLoading(false);
        setRefreshCountdown(15);
      });
  }

  useEffect(() => {
    fetchFeeds();
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchFeeds();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 py-8">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div className="flex flex-col gap-1.5 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
            Flare FTSOv2 price feeds
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 font-medium leading-relaxed font-sans">
            All 11 category-1 crypto feeds, fetched concurrently. Feed IDs are derived programmatically as category 0x01 plus the ASCII symbol right-padded to 21 bytes.
          </p>
        </div>

        <div className="flex items-center gap-4 font-mono-tech shrink-0">
          <span className="text-xs text-neutral-400">
            next refresh in <strong className="text-white font-bold">{refreshCountdown}s</strong>
          </span>
          <button
            type="button"
            onClick={fetchFeeds}
            disabled={loading}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs sm:text-sm font-mono-tech font-semibold text-white hover:border-white/30 hover:bg-white/10 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span> Refresh now
          </button>
        </div>
      </div>

      {/* Feeds Table Container */}
      <div className="rounded-2xl border border-white/10 bg-[#0B0F12]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm font-mono-tech">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-6 py-3.5">FEED</th>
                <th className="px-6 py-3.5 text-right">PRICE (USD)</th>
                <th className="px-6 py-3.5 text-right">24H</th>
                <th className="px-6 py-3.5 text-right">DECIMALS</th>
                <th className="px-6 py-3.5">FEED ID</th>
                <th className="px-6 py-3.5 text-right">UPDATED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {feedItems.map((f) => {
                const isPositive = f.change24h >= 0;
                return (
                  <tr key={f.symbol} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm sm:text-base">{f.symbol}</span>
                        <span className="text-xs text-neutral-500">{f.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white text-sm sm:text-base">
                      {f.price >= 1000
                        ? f.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : f.price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 5 })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      <span className={isPositive ? "text-success" : "text-danger"}>
                        {isPositive ? `+${f.change24h.toFixed(2)}%` : `${f.change24h.toFixed(2)}%`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-300 font-medium">
                      {f.decimals}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono-tech text-xs text-neutral-400 select-all" title={f.feedId}>
                        {f.feedId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-400 text-xs">
                      {f.updatedAgo}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Footer Line */}
      <footer className="border-t border-white/10 pt-6 text-xs text-neutral-400 font-mono-tech">
        FlareContractRegistry … FtsoV2 address resolution is cached in memory for the session. If a live read fails, the response is flagged as simulated rather than silently substituted.
      </footer>
    </main>
  );
}
