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
      <div className="rounded-xl border border-border bg-panel p-5 text-sm text-neutral-500">
        Connect a wallet (or use the Demo Wallet) above to manage holdings — Smart Opportunity Alerts
        uses this to know what to compare against.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-5">
      <h3 className="text-base font-semibold">Your Holdings</h3>

      {detected && detected.balance != null && detected.balance > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-accent2/40 bg-accent2/10 px-3 py-2 text-sm">
          <span>
            Detected {detected.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
            {detected.symbol} on {detected.chain} in your connected wallet
          </span>
          <SimulatedBadge simulated={detected.simulated} reason={detected.simulationReason} />
          <button
            type="button"
            onClick={addDetectedBalance}
            className="ml-auto rounded-lg border border-accent2 px-2 py-1 text-xs text-accent2 hover:bg-accent2/10"
          >
            Add to holdings
          </button>
        </div>
      )}

      {holdings.length > 0 && (
        <ul className="flex flex-col gap-2">
          {holdings.map((h, i) => (
            <li
              key={`${h.symbol}-${i}`}
              className="flex items-center justify-between rounded-lg border border-border bg-ink/60 px-3 py-2 text-sm"
            >
              <span>
                {h.amount.toLocaleString()} {h.symbol} on {h.chain}
                {h.currentProtocol ? (
                  <span className="text-neutral-500">
                    {" "}
                    — earning {h.currentApy ?? 0}% via {h.currentProtocol}
                  </span>
                ) : (
                  <span className="text-neutral-500"> — idle, not earning yield</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => removeHolding(i)}
                className="text-xs text-neutral-500 hover:text-danger"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addHolding} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500">Symbol</label>
          <input
            value={form.symbol}
            onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
            placeholder="USDC"
            className="w-24 rounded-lg border border-border bg-ink px-2 py-1.5 text-sm outline-none focus:border-accent2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500">Chain</label>
          <input
            value={form.chain}
            onChange={(e) => setForm((f) => ({ ...f, chain: e.target.value }))}
            placeholder="Ethereum"
            className="w-28 rounded-lg border border-border bg-ink px-2 py-1.5 text-sm outline-none focus:border-accent2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500">Amount</label>
          <input
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="10000"
            inputMode="decimal"
            className="w-28 rounded-lg border border-border bg-ink px-2 py-1.5 text-sm outline-none focus:border-accent2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500">Current protocol (optional)</label>
          <input
            value={form.currentProtocol}
            onChange={(e) => setForm((f) => ({ ...f, currentProtocol: e.target.value }))}
            placeholder="Aave"
            className="w-28 rounded-lg border border-border bg-ink px-2 py-1.5 text-sm outline-none focus:border-accent2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500">Current APY % (optional)</label>
          <input
            value={form.currentApy}
            onChange={(e) => setForm((f) => ({ ...f, currentApy: e.target.value }))}
            placeholder="3.2"
            inputMode="decimal"
            className="w-24 rounded-lg border border-border bg-ink px-2 py-1.5 text-sm outline-none focus:border-accent2"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-neutral-300 hover:border-accent2"
        >
          Add
        </button>
      </form>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save holdings"}
        </button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
