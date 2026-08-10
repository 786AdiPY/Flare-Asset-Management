"use client";

import type { TxStatus } from "@/lib/types";
import { SimulatedBadge } from "./SimulatedBadge";

export function TxStatusCard({ status, onReset }: { status: TxStatus; onReset: () => void }) {
  const { step, txHash, error, simulated } = status;

  if (step === "idle") return null;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[#121217]/90 backdrop-blur-xl p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Execution & Transaction Status</h3>
        {simulated && <SimulatedBadge simulated={true} reason="Demo Wallet or Testnet simulation active" />}
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
        <div className="flex flex-col gap-4 rounded-xl border border-success/40 bg-success/10 p-5 text-sm text-success">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-bold text-white text-base">Transaction Execution Confirmed!</div>
              <div className="text-xs text-neutral-300">
                Route successfully executed. Yield strategy active.
              </div>
            </div>
          </div>

          {txHash && (
            <div className="flex flex-col gap-1 rounded-xl border border-success/20 bg-[#09090c] p-3 font-mono-tech text-xs text-neutral-300">
              <span className="text-neutral-500 text-[10px]">TRANSACTION HASH</span>
              <span className="break-all text-success font-bold">{txHash}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={onReset}
              className="lifi-btn-primary px-6 py-2 text-xs font-bold"
            >
              Start New Intent →
            </button>
          </div>
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

          <div className="flex justify-end pt-2">
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
