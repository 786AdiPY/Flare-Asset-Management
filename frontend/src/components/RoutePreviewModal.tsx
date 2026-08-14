"use client";

import { useState } from "react";
import type { BridgeQuoteResponse, Recommendation } from "@/lib/types";
import { SimulatedBadge } from "./SimulatedBadge";

interface RoutePreviewModalProps {
  recommendation: Recommendation;
  quote: BridgeQuoteResponse | null;
  loadingQuote: boolean;
  errorQuote: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function RoutePreviewModal({
  recommendation,
  quote,
  loadingQuote,
  errorQuote,
  onConfirm,
  onClose,
}: RoutePreviewModalProps) {
  const [confirmedCheck, setConfirmedCheck] = useState(false);

  const fromToken = recommendation.fromToken || "USDC";
  const toToken = recommendation.toToken || "USDC";
  const fromChain = recommendation.fromChain || "Flare (Coston2)";
  const toChain = recommendation.toChain || recommendation.chain || "Ethereum";
  const amount = recommendation.suggestedAmount || "100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col gap-6 overflow-y-auto rounded-3xl border border-white/15 bg-[#121217] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">Route Selection & Transaction Preview</h3>
            <p className="text-xs sm:text-sm text-neutral-300 mt-0.5">Review LI.FI execution parameters before signing</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:bg-white/15 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* Strategy Overview */}
        <div className="rounded-2xl border border-accent/40 bg-gradient-to-r from-accent/20 to-accent2/10 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-accent2 uppercase tracking-wider font-mono-tech">
              {recommendation.badgeTag || "Selected Strategy"}
            </span>
            <span className="text-xs sm:text-sm text-neutral-200 font-mono-tech font-bold">
              APY: {recommendation.estimatedApy != null ? `${recommendation.estimatedApy.toFixed(2)}%` : "—"}
            </span>
          </div>
          <h4 className="mt-1.5 text-lg sm:text-xl font-bold text-white">{recommendation.strategy}</h4>
          <p className="mt-1 text-xs sm:text-sm text-neutral-200 leading-relaxed">{recommendation.explanation}</p>
        </div>

        {/* Route Details */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
          <h5 className="text-xs sm:text-sm font-bold text-neutral-300 uppercase tracking-wider font-mono-tech">
            LI.FI Bridge & Swap Execution Path
          </h5>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-[#09090c] p-4">
              <span className="text-xs text-neutral-400 block mb-1 font-mono-tech">From Asset</span>
              <div className="text-base sm:text-lg font-bold text-white">
                {amount} {fromToken}
              </div>
              <div className="text-xs sm:text-sm text-neutral-300 font-mono-tech mt-0.5">{fromChain}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#09090c] p-4">
              <span className="text-xs text-neutral-400 block mb-1 font-mono-tech">Estimated Output</span>
              <div className="text-base sm:text-lg font-bold text-success">
                {loadingQuote
                  ? "Calculating..."
                  : quote
                  ? `${quote.estimatedToAmount} ${toToken}`
                  : `~${amount} ${toToken}`}
              </div>
              <div className="text-xs sm:text-sm text-neutral-300 font-mono-tech mt-0.5">{toChain}</div>
            </div>
          </div>

          {/* Quote metrics */}
          {loadingQuote ? (
            <div className="py-4 text-center text-xs sm:text-sm text-accent2 animate-pulse font-mono-tech">
              Fetching optimal LI.FI bridge route & gas estimation...
            </div>
          ) : errorQuote ? (
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs sm:text-sm text-danger">
              Route info: {errorQuote}
            </div>
          ) : quote ? (
            <div className="grid grid-cols-3 gap-3 text-xs sm:text-sm font-mono-tech">
              <div className="rounded-xl border border-white/10 bg-[#09090c] p-3 text-center">
                <span className="text-neutral-400 block text-xs">Router Tool</span>
                <span className="font-bold text-white text-sm">{quote.tool}</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#09090c] p-3 text-center">
                <span className="text-neutral-400 block text-xs">Est. Duration</span>
                <span className="font-bold text-white text-sm">
                  {quote.estimatedDurationSeconds ? `${quote.estimatedDurationSeconds}s` : "~90s"}
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#09090c] p-3 text-center">
                <span className="text-neutral-400 block text-xs">Gas & Fees</span>
                <span className="font-bold text-white text-sm">
                  ${((quote.feeCostsUsd || 0) + (quote.gasCostsUsd || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          ) : null}

          {quote && (
            <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-300 pt-1 font-mono-tech">
              <span>Slippage Tolerance: {quote.slippagePct ?? 0.5}%</span>
              <SimulatedBadge simulated={quote.simulated} reason={quote.simulationReason} />
            </div>
          )}
        </div>

        {/* Safety & Non-custodial declaration */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-300">
          <span className="text-xl">🛡️</span>
          <div className="leading-relaxed">
            <strong className="font-bold text-amber-200">Non-Custodial Protection:</strong> Funds remain directly in your connected EVM wallet.
            Explicit wallet signature is required for execution.
          </div>
        </div>

        {/* Explicit Confirmation Checkbox */}
        <label className="flex items-center gap-3 text-xs sm:text-sm text-neutral-200 cursor-pointer select-none font-medium">
          <input
            type="checkbox"
            checked={confirmedCheck}
            onChange={(e) => setConfirmedCheck(e.target.checked)}
            className="h-4.5 w-4.5 rounded border-white/20 bg-[#09090c] accent-accent"
          />
          <span>I confirm this transaction route and approve execution via LI.FI & MetaMask.</span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="lifi-btn-secondary px-5 py-2.5 text-xs sm:text-sm font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!confirmedCheck || loadingQuote}
            onClick={onConfirm}
            className="lifi-btn-primary px-6 py-2.5 text-xs font-bold disabled:opacity-40"
          >
            Confirm & Execute Route →
          </button>
        </div>
      </div>
    </div>
  );
}
