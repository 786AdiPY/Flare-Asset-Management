"use client";

import { useState, type FormEvent } from "react";
import { postIntent } from "@/lib/api";
import { useWalletContext } from "@/lib/walletContext";
import type { ConversationTurn, IntentResponse } from "@/lib/types";

const EXAMPLES = [
  "Generate passive income with my tokenized gold",
  "I want low-risk yield on my USDC across chains",
  "Find the best cross-chain opportunity for my FLR holdings",
];

export function IntentForm({
  history,
  onResult,
}: {
  history: ConversationTurn[];
  onResult: (userText: string, result: IntentResponse) => void;
}) {
  const { walletAddress } = useWalletContext();
  const [intent, setIntent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRefining = history.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!intent.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await postIntent({ intent, walletAddress, history });
      onResult(intent, result);
      setIntent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get a recommendation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative group">
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder={
            isRefining
              ? 'e.g. "make it lower risk" or "prefer Flare-native protocols"'
              : 'e.g. "Generate passive income with my tokenized gold"'
          }
          rows={isRefining ? 2 : 3}
          className="w-full resize-none rounded-2xl border border-white/10 bg-[#121217]/90 p-4 text-sm text-white placeholder-neutral-500 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all shadow-inner"
        />
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-transparent group-focus-within:border-accent/50 transition-colors" />
      </div>

      {!isRefining && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setIntent(ex)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300 hover:border-accent2 hover:text-white hover:bg-accent/20 transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={loading || !intent.trim()}
          className="lifi-btn-primary px-6 py-2.5 text-xs font-bold disabled:opacity-40"
        >
          {loading ? "Analyzing Intent with LLM…" : isRefining ? "Refine Intent →" : "Get Recommendations →"}
        </button>
        {isRefining && (
          <span className="text-xs text-accent2 font-mono-tech">
            Refining active conversation turn #{history.length / 2 + 1}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
