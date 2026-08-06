"use client";

import { useCallback, useState } from "react";
import { AlertsPanel } from "@/components/AlertsPanel";
import { IntentForm } from "@/components/IntentForm";
import { PriceTicker } from "@/components/PriceTicker";
import { RecommendationCard } from "@/components/RecommendationCard";
import { WalletConnect } from "@/components/WalletConnect";
import type { IntentResponse } from "@/lib/types";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [result, setResult] = useState<IntentResponse | null>(null);

  const handleAddressChange = useCallback((addr: string | null) => setWalletAddress(addr), []);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI-Asset Router</h1>
          <p className="text-sm text-neutral-400">Intent Router for Tokenized Assets</p>
        </div>
        <WalletConnect walletAddress={walletAddress} onAddressChange={handleAddressChange} />
      </header>

      <PriceTicker />

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-5">
        <h2 className="text-base font-semibold">Describe your goal</h2>
        <IntentForm walletAddress={walletAddress} onResult={setResult} />
      </section>

      {result && <RecommendationCard result={result} />}

      <AlertsPanel walletAddress={walletAddress} />

      <footer className="pb-6 text-center text-xs text-neutral-600">
        Every price, yield, and recommendation above is either live (OpenRouter, Flare FTSO, DeFiLlama,
        LI.FI) or clearly-labeled simulated fallback data, so the demo always works end to end.
      </footer>
    </main>
  );
}
