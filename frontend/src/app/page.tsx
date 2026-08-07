"use client";

import { useState } from "react";
import { IntentForm } from "@/components/IntentForm";
import { PriceTicker } from "@/components/PriceTicker";
import { RecommendationCard } from "@/components/RecommendationCard";
import type { ConversationTurn, IntentResponse } from "@/lib/types";

export default function Home() {
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [result, setResult] = useState<IntentResponse | null>(null);

  function handleResult(userText: string, res: IntentResponse) {
    const top = res.recommendations[0];
    setHistory((prev) => [
      ...prev,
      { role: "user", content: userText },
      { role: "assistant", content: top ? top.strategy : "No recommendation." },
    ]);
    setResult(res);
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">AI-Asset Router</h1>
        <p className="text-sm text-neutral-400">Intent Router for Tokenized Assets</p>
      </div>

      <PriceTicker />

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-5">
        <h2 className="text-base font-semibold">
          {history.length === 0 ? "Describe your goal" : "Refine your recommendation"}
        </h2>
        <IntentForm history={history} onResult={handleResult} />
      </section>

      {result && <RecommendationCard result={result} />}

      <footer className="pb-6 text-center text-xs text-neutral-600">
        Every price, yield, and recommendation above is either live (OpenRouter, Flare FTSO, DeFiLlama,
        LI.FI) or clearly-labeled simulated fallback data, so the demo always works end to end.
      </footer>
    </main>
  );
}
