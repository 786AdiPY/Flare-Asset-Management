"use client";

import { useState, type FormEvent } from "react";
import { postIntent } from "@/lib/api";
import type { IntentResponse } from "@/lib/types";

const EXAMPLES = [
  "Generate passive income with my tokenized gold",
  "I want low-risk yield on my USDC across chains",
  "Find the best cross-chain opportunity for my FLR holdings",
];

export function IntentForm({
  walletAddress,
  onResult,
}: {
  walletAddress: string | null;
  onResult: (result: IntentResponse) => void;
}) {
  const [intent, setIntent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!intent.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await postIntent({ intent, walletAddress });
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get a recommendation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        placeholder='e.g. "Generate passive income with my tokenized gold"'
        rows={3}
        className="w-full resize-none rounded-lg border border-border bg-ink p-3 text-sm outline-none focus:border-accent2"
      />
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setIntent(ex)}
            className="rounded-full border border-border px-3 py-1 text-xs text-neutral-400 hover:border-accent2 hover:text-accent2"
          >
            {ex}
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={loading || !intent.trim()}
        className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
      >
        {loading ? "Analyzing…" : "Get recommendation"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
