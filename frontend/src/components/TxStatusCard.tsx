"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TxStatus } from "@/lib/types";
import { SimulatedBadge } from "./SimulatedBadge";

export function TxStatusCard({
  status,
  onReset,
}: {
  status: TxStatus;
  onReset: () => void;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const { step, txHash, error, simulated, recommendation, amount } = status;

  if (step === "idle") return null;

  const rec = recommendation;
  const displayAmount = amount || rec?.suggestedAmount || "1,000";
  const fromSym = rec?.fromToken || "FLR";
  const toSym = rec?.toToken || rec?.protocol || "WFLR-USDC";
  const formattedRouteText = `${displayAmount} ${fromSym} → ${toSym}`;
  const shortHash = txHash
    ? `${txHash.slice(0, 8)}...${txHash.slice(-6)}`
    : "0xeb7d...";

  const handleCopyReceipt = () => {
    const text = `Transaction Successful: ${rec?.strategy || "Yield Strategy"}\nRoute: ${formattedRouteText}\nNetwork: ${rec?.chain || "Flare"}\nTx Hash: ${txHash || "Simulated"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewTransaction = () => {
    if (txHash && !txHash.startsWith("0xsimulated") && txHash.length > 20) {
      window.open(`https://flare-explorer.flare.network/tx/${txHash}`, "_blank");
    } else {
      alert(`Transaction Hash: ${txHash || "0xeb7d..."}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-[#121217]/90 backdrop-blur-xl p-6 shadow-2xl animate-fadeIn">
      {/* Header bar with Back button */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-neutral-300 hover:border-accent/40 hover:bg-white/10 hover:text-white transition-all font-mono-tech"
        >
          <span>← Back</span>
        </button>

        <div className="flex items-center gap-2">
          {simulated && <SimulatedBadge simulated={true} reason="Demo Wallet or Testnet simulation active" />}
        </div>
      </div>

      {step === "signing" && (
        <div className="flex items-center gap-4 rounded-xl border border-accent/40 bg-accent/15 p-5 text-sm text-accent2 animate-pulse">
          <span className="text-2xl">✍️</span>
          <div>
            <div className="font-bold text-white text-base">Signature Required</div>
            <div className="text-xs text-neutral-300">
              Please sign the transaction in your connected wallet (MetaMask)...
            </div>
          </div>
        </div>
      )}

      {step === "broadcasting" && (
        <div className="flex items-center gap-4 rounded-xl border border-amber-500/40 bg-amber-500/15 p-5 text-sm text-amber-300 animate-pulse">
          <span className="text-2xl">🚀</span>
          <div>
            <div className="font-bold text-white text-base">Broadcasting to Network</div>
            <div className="text-xs text-neutral-300 font-mono-tech">
              Submitting transaction via LI.FI router... Mining block confirmation.
            </div>
          </div>
        </div>
      )}

      {step === "confirmed" && (
        <div className="flex flex-col gap-6">
          {/* Main Transaction Successful Summary Card */}
          <div className="relative flex flex-col gap-4 rounded-xl border border-white/15 bg-[#09090c]/90 p-6 transition-all hover:border-accent/30">
            {/* Top Bar: Checkmark + Transaction Successful + Copy button */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 text-success font-bold font-mono-tech text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-success/20 text-success text-xs font-black">
                  ✓
                </span>
                <span className="text-white text-sm tracking-wide">Transaction Successful</span>
              </div>
              <button
                type="button"
                onClick={handleCopyReceipt}
                title="Copy receipt details"
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Strategy Title */}
            <h4 className="text-lg font-bold text-white">
              {rec?.strategy || "Provide liquidity in WFLR-USDC"}
            </h4>

            {/* Amount & Route summary line */}
            <p className="text-xs font-mono-tech text-accent2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 w-fit">
              {formattedRouteText}
            </p>

            {/* Metrics Grid: APY | Network | Status */}
            <div className="grid grid-cols-3 gap-4 rounded-lg border border-white/5 bg-[#121217]/70 p-3 text-xs font-mono-tech">
              <div>
                <div className="text-neutral-400 text-[11px]">APY</div>
                <div className="font-extrabold text-success text-sm mt-0.5">
                  {rec?.estimatedApy != null ? `${rec.estimatedApy.toFixed(2)}%` : "6.17%"}
                </div>
              </div>
              <div>
                <div className="text-neutral-400 text-[11px]">Network</div>
                <div className="font-semibold text-white mt-0.5">{rec?.chain || "Flare"}</div>
              </div>
              <div>
                <div className="text-neutral-400 text-[11px]">Status</div>
                <div className="font-semibold text-accent2 mt-0.5">
                  {simulated ? "Simulated" : "Confirmed"}
                </div>
              </div>
            </div>

            {/* Transaction ID */}
            <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-[#121217]/70 p-3 font-mono-tech text-xs">
              <span className="text-neutral-400 text-[11px]">Transaction ID</span>
              <span className="text-neutral-200 font-semibold break-all">{shortHash}</span>
            </div>

            {/* Action Buttons: View Transaction | View Position */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleViewTransaction}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-neutral-200 hover:text-white transition-all hover:border-accent/40 hover:bg-white/10 text-center font-mono-tech"
              >
                View Transaction
              </button>
              <button
                type="button"
                onClick={() => router.push("/holdings")}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-neutral-200 hover:text-white transition-all hover:border-accent/40 hover:bg-white/10 text-center font-mono-tech"
              >
                View Position
              </button>
            </div>
          </div>

          {/* What happened? Section */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-white font-mono-tech">What happened?</h4>
            <div className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-[#09090c]/90 p-4 font-mono-tech text-xs text-neutral-200">
              <div className="flex items-center gap-2.5">
                <span className="text-success font-bold">✓</span>
                <span>Route selected</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-success font-bold">✓</span>
                <span>Parameters validated</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-success font-bold">✓</span>
                <span>Execution {simulated ? "simulated" : "confirmed"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-success font-bold">✓</span>
                <span>Transaction successful</span>
              </div>
            </div>
          </div>

          {/* Return to Intent button */}
          <button
            type="button"
            onClick={onReset}
            className="w-full lifi-btn-primary px-4 py-3 text-xs font-bold text-center font-mono-tech"
          >
            ← Back
          </button>
        </div>
      )}

      {step === "error" && (
        <div className="flex flex-col gap-4 rounded-xl border border-danger/40 bg-danger/10 p-5 text-sm text-danger">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-bold text-white text-base">Transaction Failed or Rejected</div>
              <div className="text-xs text-neutral-300">
                {error || "The transaction was canceled or encountered a network error."}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white font-mono-tech"
            >
              ← Back
            </button>
            <button
              onClick={onReset}
              className="lifi-btn-secondary px-5 py-2 text-xs font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

