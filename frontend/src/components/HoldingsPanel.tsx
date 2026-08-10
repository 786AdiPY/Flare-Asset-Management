"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getPortfolio, getWalletBalance, savePortfolio } from "@/lib/api";
import { useWalletContext } from "@/lib/walletContext";
import type { AssetHolding, WalletBalanceResponse } from "@/lib/types";
import { SimulatedBadge } from "./SimulatedBadge";

const EMPTY_FORM = { symbol: "", chain: "", amount: "", currentProtocol: "", currentApy: "" };

export function HoldingsPanel({ onSaved }: { onSaved: () => void }) {
  const { walletAddress } = useWalletContext();
  const [holdings, setHoldings] = useState<AssetHolding[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<WalletBalanceResponse | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setHoldings([]);
      setDetected(null);
      return;
    }
    let cancelled = false;
    getPortfolio(walletAddress)
      .then((res) => {
        if (!cancelled) setHoldings(res.holdings);
      })
      .catch(() => {
        if (!cancelled) setHoldings([]);
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

  function addDetectedBalance() {
    if (!detected || detected.balance == null) return;
    setHoldings((prev) => [
      ...prev,
      { symbol: detected.symbol, chain: detected.chain, amount: detected.balance as number },
    ]);
    setDetected(null);
  }

  function addHolding(e: FormEvent) {
    e.preventDefault();
    if (!form.symbol.trim() || !form.chain.trim() || !form.amount.trim()) return;
    setHoldings((prev) => [
      ...prev,
      {
        symbol: form.symbol.trim().toUpperCase(),
        chain: form.chain.trim(),
        amount: Number(form.amount),
        currentProtocol: form.currentProtocol.trim() || null,
        currentApy: form.currentApy.trim() ? Number(form.currentApy) : null,
      },
    ]);
    setForm(EMPTY_FORM);
  }

  function removeHolding(index: number) {
    setHoldings((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!walletAddress) return;
    setSaving(true);
    setError(null);
    try {
      await savePortfolio(walletAddress, holdings);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save holdings");
    } finally {
      setSaving(false);
    }
  }

  if (!walletAddress) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#121217]/70 p-6 text-xs text-neutral-400 backdrop-blur-md">
        Connect a wallet (or use the Demo Wallet) above to manage holdings — Smart Opportunity Alerts
        uses this to know what to compare against.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[#121217]/80 backdrop-blur-xl p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Your Portfolio & Asset Holdings</h3>
        <span className="text-xs text-neutral-400 font-mono-tech">
          {holdings.length} asset{holdings.length !== 1 ? "s" : ""} registered
        </span>
      </div>

      {detected && detected.balance != null && detected.balance > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/15 px-4 py-3 text-xs">
          <span className="text-white">
            Detected <strong className="text-accent2">{detected.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {detected.symbol}</strong> on {detected.chain} in your wallet
          </span>
          <div className="flex items-center gap-3">
            <SimulatedBadge simulated={detected.simulated} reason={detected.simulationReason} />
            <button
              type="button"
              onClick={addDetectedBalance}
              className="lifi-btn-primary px-3 py-1 text-xs font-bold"
            >
              Add to holdings
            </button>
          </div>
        </div>
      )}

      {holdings.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {holdings.map((h, i) => (
            <li
              key={`${h.symbol}-${i}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-[#09090c] px-4 py-3 text-xs"
            >
              <span>
                <strong className="text-white font-bold">{h.amount.toLocaleString()} {h.symbol}</strong> on {h.chain}
                {h.currentProtocol ? (
                  <span className="text-neutral-400 font-mono-tech">
                    {" "}
                    — earning {h.currentApy ?? 0}% via {h.currentProtocol}
                  </span>
                ) : (
                  <span className="text-neutral-400 font-mono-tech"> — idle, not earning yield</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => removeHolding(i)}
                className="text-xs text-neutral-400 hover:text-danger font-bold transition-colors"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addHolding} className="flex flex-wrap items-end gap-3 pt-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-neutral-400 uppercase">Symbol</label>
          <input
            value={form.symbol}
            onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
            placeholder="USDC"
            className="w-24 rounded-xl border border-white/10 bg-[#09090c] px-3 py-2 text-xs text-white outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-neutral-400 uppercase">Chain</label>
          <input
            value={form.chain}
            onChange={(e) => setForm((f) => ({ ...f, chain: e.target.value }))}
            placeholder="Ethereum"
            className="w-28 rounded-xl border border-white/10 bg-[#09090c] px-3 py-2 text-xs text-white outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-neutral-400 uppercase">Amount</label>
          <input
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="10000"
            inputMode="decimal"
            className="w-28 rounded-xl border border-white/10 bg-[#09090c] px-3 py-2 text-xs text-white outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-neutral-400 uppercase">Current Protocol</label>
          <input
            value={form.currentProtocol}
            onChange={(e) => setForm((f) => ({ ...f, currentProtocol: e.target.value }))}
            placeholder="Aave"
            className="w-28 rounded-xl border border-white/10 bg-[#09090c] px-3 py-2 text-xs text-white outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-neutral-400 uppercase">Current APY %</label>
          <input
            value={form.currentApy}
            onChange={(e) => setForm((f) => ({ ...f, currentApy: e.target.value }))}
            placeholder="3.2"
            inputMode="decimal"
            className="w-24 rounded-xl border border-white/10 bg-[#09090c] px-3 py-2 text-xs text-white outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="lifi-btn-secondary px-4 py-2 text-xs font-semibold"
        >
          Add Asset
        </button>
      </form>

      <div className="flex items-center gap-3 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="lifi-btn-primary px-6 py-2.5 text-xs font-bold disabled:opacity-50"
        >
          {saving ? "Saving Portfolio…" : "Save Holdings & Continue →"}
        </button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
