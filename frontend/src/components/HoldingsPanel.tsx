"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getPortfolio, getWalletBalance, savePortfolio } from "@/lib/api";
import { useWalletContext } from "@/lib/walletContext";
import type { AssetHolding, WalletBalanceResponse } from "@/lib/types";

const EMPTY_FORM = { symbol: "", chain: "", amount: "", currentProtocol: "", currentApy: "" };

const PRICE_MAP: Record<string, number> = {
  FLR: 0.0218,
  USDC: 1.0,
  USDT: 1.0,
  XRP: 2.34,
  FXRP: 2.34,
  BTC: 62641.0,
  WBTC: 62641.0,
  ETH: 1866.0,
  WETH: 1866.0,
};

export function HoldingsPanel({
  onSaved,
  onMetricsCalculated,
}: {
  onSaved: () => void;
  onMetricsCalculated?: (metrics: { portfolioValue: number; blendedApy: number; idleCapital: number }) => void;
}) {
  const { walletAddress, setWalletAddress } = useWalletContext();
  const [holdings, setHoldings] = useState<AssetHolding[]>([
    { symbol: "FLR", chain: "Flare", amount: 5000, currentProtocol: null, currentApy: null },
    { symbol: "USDC", chain: "Base", amount: 500, currentProtocol: "Aave v3", currentApy: 3.2 },
    { symbol: "XRP", chain: "XRPL", amount: 200, currentProtocol: null, currentApy: null },
  ]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<WalletBalanceResponse | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      // Use default sample data if no wallet is connected
      const defaultData: AssetHolding[] = [
        { symbol: "FLR", chain: "Flare", amount: 5000, currentProtocol: null, currentApy: null },
        { symbol: "USDC", chain: "Base", amount: 500, currentProtocol: "Aave v3", currentApy: 3.2 },
        { symbol: "XRP", chain: "XRPL", amount: 200, currentProtocol: null, currentApy: null },
      ];
      setHoldings(defaultData);
      calculateMetrics(defaultData);
      setDetected(null);
      setHasUnsavedChanges(false);
      return;
    }

    let cancelled = false;
    getPortfolio(walletAddress)
      .then((res) => {
        if (!cancelled) {
          const list = res.holdings.length > 0 ? res.holdings : [
            { symbol: "FLR", chain: "Flare", amount: 5000, currentProtocol: null, currentApy: null },
            { symbol: "USDC", chain: "Base", amount: 500, currentProtocol: "Aave v3", currentApy: 3.2 },
            { symbol: "XRP", chain: "XRPL", amount: 200, currentProtocol: null, currentApy: null },
          ];
          setHoldings(list);
          calculateMetrics(list);
          setHasUnsavedChanges(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          calculateMetrics(holdings);
        }
      });

    getWalletBalance(walletAddress)
      .then((res) => {
        if (!cancelled) setDetected(res);
      })
      .catch(() => {
        if (!cancelled) setDetected(null);
      });

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  function calculateMetrics(list: AssetHolding[]) {
    let totalVal = 0;
    let totalIdle = 0;
    let weightedApySum = 0;

    list.forEach((item) => {
      const price = PRICE_MAP[item.symbol.toUpperCase()] ?? 1.0;
      const val = item.amount * price;
      totalVal += val;
      if (!item.currentProtocol || item.currentProtocol.toLowerCase().includes("wallet") || item.currentProtocol.toLowerCase().includes("unallocated")) {
        totalIdle += val;
      }
      if (item.currentApy && item.currentApy > 0) {
        weightedApySum += val * item.currentApy;
      }
    });

    const blendedApy = totalVal > 0 ? weightedApySum / totalVal : 0;
    onMetricsCalculated?.({ portfolioValue: totalVal, blendedApy, idleCapital: totalIdle });
  }

  useEffect(() => {
    calculateMetrics(holdings);
  }, [holdings]);

  async function handleSyncWallet() {
    if (!walletAddress) return;
    setSyncing(true);
    try {
      const [portRes, balRes] = await Promise.all([
        getPortfolio(walletAddress).catch(() => ({ holdings: [] })),
        getWalletBalance(walletAddress).catch(() => null),
      ]);
      if (portRes.holdings && portRes.holdings.length > 0) {
        setHoldings(portRes.holdings);
        setHasUnsavedChanges(false);
      }
      setDetected(balRes);
    } finally {
      setSyncing(false);
    }
  }

  function addDetectedBalance() {
    if (!detected || detected.balance == null) return;
    const newHoldings: AssetHolding[] = [
      ...holdings,
      { symbol: detected.symbol, chain: detected.chain, amount: detected.balance as number },
    ];
    setHoldings(newHoldings);
    setDetected(null);
    setHasUnsavedChanges(true);
  }

  function addHolding(e: FormEvent) {
    e.preventDefault();
    if (!form.symbol.trim() || !form.chain.trim() || !form.amount.trim()) return;
    const newHoldings: AssetHolding[] = [
      ...holdings,
      {
        symbol: form.symbol.trim().toUpperCase(),
        chain: form.chain.trim(),
        amount: Number(form.amount),
        currentProtocol: form.currentProtocol.trim() || null,
        currentApy: form.currentApy.trim() ? Number(form.currentApy) : null,
      },
    ];
    setHoldings(newHoldings);
    setForm(EMPTY_FORM);
    setHasUnsavedChanges(true);
  }

  function removeHolding(index: number) {
    const updated = holdings.filter((_, i) => i !== index);
    setHoldings(updated);
    setHasUnsavedChanges(true);
  }

  const hasValidForm = Boolean(form.symbol.trim() && form.chain.trim() && form.amount.trim());
  const showSaveButton = hasValidForm || (hasUnsavedChanges && holdings.length > 0);

  async function handleSave() {
    if (!walletAddress) return;
    setSaving(true);
    setError(null);

    let toSave = [...holdings];
    if (form.symbol.trim() && form.chain.trim() && form.amount.trim()) {
      const newAsset: AssetHolding = {
        symbol: form.symbol.trim().toUpperCase(),
        chain: form.chain.trim(),
        amount: Number(form.amount),
        currentProtocol: form.currentProtocol.trim() || null,
        currentApy: form.currentApy.trim() ? Number(form.currentApy) : null,
      };
      toSave.push(newAsset);
      setHoldings(toSave);
      setForm(EMPTY_FORM);
    }

    try {
      await savePortfolio(walletAddress, toSave);
      setHasUnsavedChanges(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save holdings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Wallet Banner */}
      {!walletAddress && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0c0d12]/90 backdrop-blur-md p-4 sm:p-5 shadow-lg">
          <span className="text-xs sm:text-sm text-neutral-300 font-mono-tech">
            Connect a wallet to auto-detect your live native FLR balance instead of the saved snapshot.
          </span>
          <button
            type="button"
            onClick={() => setWalletAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F")}
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs sm:text-sm font-mono-tech font-semibold text-white hover:border-white/40 hover:bg-white/10 transition-all shrink-0"
          >
            Connect wallet
          </button>
        </div>
      )}

      {/* Portfolio Holdings Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
            Portfolio holdings
          </h2>
          <button
            type="button"
            onClick={handleSyncWallet}
            disabled={syncing || !walletAddress}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-mono-tech font-medium text-neutral-300 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <span className={syncing ? "animate-spin" : ""}>🔄</span> Re-detect native FLR
          </button>
        </div>

        {detected && detected.balance != null && detected.balance > 0 && (
          <button
            type="button"
            onClick={addDetectedBalance}
            className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-mono-tech font-bold text-accent hover:bg-accent/20 transition-all"
          >
            + Add Detected ({detected.balance.toLocaleString()} {detected.symbol})
          </button>
        )}
      </div>

      {error && <p className="text-sm text-danger font-mono-tech">{error}</p>}

      {/* Holdings Table Container */}
      <div className="rounded-2xl border border-white/10 bg-[#0B0F12]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm font-mono-tech">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-3.5">ASSET</th>
                <th className="px-5 py-3.5">AMOUNT</th>
                <th className="px-5 py-3.5">VALUE</th>
                <th className="px-5 py-3.5">ALLOCATION</th>
                <th className="px-5 py-3.5">APY</th>
                <th className="px-4 py-3.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {holdings.map((h, i) => {
                const price = PRICE_MAP[h.symbol.toUpperCase()] ?? 1.0;
                const val = h.amount * price;
                const isAuto = h.symbol.toUpperCase() === "FLR";
                const isIdle = !h.currentProtocol || h.currentProtocol.toLowerCase().includes("wallet") || h.currentProtocol.toLowerCase().includes("unallocated");

                return (
                  <tr key={`${h.symbol}-${h.chain}-${i}`} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm sm:text-base">{h.symbol}</span>
                        {isAuto && (
                          <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                            auto-detected
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500">{h.chain}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-white text-sm sm:text-base">
                      {h.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-neutral-300 font-medium">
                      ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-neutral-300 font-medium">
                      {h.currentProtocol ?? "Wallet (unallocated)"}
                    </td>
                    <td className="px-5 py-4">
                      {isIdle ? (
                        <span className="text-neutral-500 italic">idle</span>
                      ) : (
                        <span className="font-bold text-success text-sm sm:text-base">
                          {h.currentApy}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => removeHolding(i)}
                        className="text-neutral-500 hover:text-danger transition-colors p-1"
                        title="Remove holding"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Holding Form Row inside Table */}
        <form onSubmit={addHolding} className="border-t border-white/10 bg-[#07090c] p-4 flex flex-wrap items-center gap-3">
          <input
            placeholder="Symbol"
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            className="w-28 rounded-xl border border-white/10 bg-[#0c0d12] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-accent"
          />
          <div className="relative w-32">
            <input
              placeholder="Chain"
              value={form.chain}
              onChange={(e) => setForm({ ...form, chain: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-[#0c0d12] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-accent"
            />
          </div>
          <input
            placeholder="Amount"
            type="number"
            step="any"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-36 rounded-xl border border-white/10 bg-[#0c0d12] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-accent"
          />
          <input
            placeholder="Current protocol (optional)"
            value={form.currentProtocol}
            onChange={(e) => setForm({ ...form, currentProtocol: e.target.value })}
            className="flex-1 min-w-[180px] rounded-xl border border-white/10 bg-[#0c0d12] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-accent"
          />
          <input
            placeholder="APY %"
            type="number"
            step="any"
            value={form.currentApy}
            onChange={(e) => setForm({ ...form, currentApy: e.target.value })}
            className="w-24 rounded-xl border border-white/10 bg-[#0c0d12] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-mono-tech font-bold text-white hover:bg-white/20 transition-all shrink-0"
          >
            + Add
          </button>
        </form>
      </div>

      {/* Save Button floating callout */}
      {showSaveButton && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-ivory px-6 py-3 text-xs sm:text-sm font-mono-tech font-bold text-obsidian shadow-xl hover:bg-neutral-200 transition-all hover:scale-105 disabled:opacity-50"
          >
            {saving ? "Saving Holdings..." : "Save Holdings & Continue →"}
          </button>
        </div>
      )}
    </div>
  );
}
