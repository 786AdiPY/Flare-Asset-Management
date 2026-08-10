"use client";

import { useEffect, useState } from "react";
import { HoldingsPanel } from "@/components/HoldingsPanel";
import { IntentForm } from "@/components/IntentForm";
import { PriceTicker } from "@/components/PriceTicker";
import { RecommendationCard } from "@/components/RecommendationCard";
import { RoutePreviewModal } from "@/components/RoutePreviewModal";
import { StepTracker } from "@/components/StepTracker";
import { TxStatusCard } from "@/components/TxStatusCard";
import { postBridgeQuote } from "@/lib/api";
import type {
  BridgeQuoteResponse,
  ConversationTurn,
  IntentResponse,
  Recommendation,
  TxStatus,
} from "@/lib/types";
import { useWallet } from "@/lib/wallet";
import { useWalletContext } from "@/lib/walletContext";

export default function Home() {
  const { walletAddress } = useWalletContext();
  const { sendTransaction } = useWallet();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [result, setResult] = useState<IntentResponse | null>(null);

  // Selected strategy & modal state
  const [selectedStrategy, setSelectedStrategy] = useState<Recommendation | null>(null);
  const [quote, setQuote] = useState<BridgeQuoteResponse | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [errorQuote, setErrorQuote] = useState<string | null>(null);

  // Execution state
  const [txStatus, setTxStatus] = useState<TxStatus>({ step: "idle" });

  // Update flow step based on user actions
  useEffect(() => {
    if (!walletAddress) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      setCurrentStep(2);
    }
  }, [walletAddress, currentStep]);

  function handleIntentResult(userText: string, res: IntentResponse) {
    const top = res.recommendations[0];
    setHistory((prev) => [
      ...prev,
      { role: "user", content: userText },
      { role: "assistant", content: top ? top.strategy : "No recommendation." },
    ]);
    setResult(res);
    setCurrentStep(4); // Move to Strategy selection step
  }

  async function handleSelectStrategy(rec: Recommendation) {
    setSelectedStrategy(rec);
    setQuote(null);
    setErrorQuote(null);
    setLoadingQuote(true);
    setCurrentStep(5); // Move to Route Preview step

    try {
      const q = await postBridgeQuote({
        fromChain: rec.fromChain || "Flare",
        toChain: rec.toChain || rec.chain || "Ethereum",
        fromToken: rec.fromToken || "USDC",
        toToken: rec.toToken || "USDC",
        fromAmount: rec.suggestedAmount || "100",
        fromAddress: walletAddress || "0x0000000000000000000000000000000000000000",
      });
      setQuote(q);
    } catch (err) {
      setErrorQuote(err instanceof Error ? err.message : "Failed to fetch LI.FI quote");
    } finally {
      setLoadingQuote(false);
    }
  }

  async function handleExecuteRoute() {
    if (!selectedStrategy) return;

    setCurrentStep(6); // Move to Execution step
    setTxStatus({ step: "signing", simulated: quote?.simulated });

    try {
      let txHash = "";

      // If MetaMask is connected and we have a valid transaction request
      if (
        typeof window !== "undefined" &&
        window.ethereum &&
        walletAddress &&
        !walletAddress.includes("DEM0") &&
        quote?.transactionRequest
      ) {
        setTxStatus({ step: "signing" });
        txHash = await sendTransaction({
          to: quote.transactionRequest.to,
          data: quote.transactionRequest.data,
          value: quote.transactionRequest.value,
          gasLimit: quote.transactionRequest.gasLimit,
        });
      } else {
        // Demo Wallet or testnet simulation execution
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setTxStatus({ step: "broadcasting", simulated: true });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      }

      setTxStatus({
        step: "confirmed",
        txHash,
        simulated: quote?.simulated ?? true,
      });
      setSelectedStrategy(null);
    } catch (err) {
      setTxStatus({
        step: "error",
        error: err instanceof Error ? err.message : "Transaction execution failed",
      });
    }
  }

  function handleResetFlow() {
    setSelectedStrategy(null);
    setQuote(null);
    setTxStatus({ step: "idle" });
    setCurrentStep(walletAddress ? 3 : 1);
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12">
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white font-display">
          AI Intent <span className="lifi-text-gradient">Asset Router</span>
        </h1>
        <p className="text-sm md:text-base text-neutral-400 font-medium">
          Non-custodial Intent Router for Tokenized Real-World Assets · Powered by Flare FTSO &amp; LI.FI Routing
        </p>
      </div>

      <PriceTicker />

      {/* Visual Step Tracker */}
      <StepTracker currentStep={currentStep} onSelectStep={(step) => setCurrentStep(step)} />

      {/* Step 1 & 2: Wallet & Portfolio Holdings */}
      <section className="flex flex-col gap-4">
        <HoldingsPanel onSaved={() => setCurrentStep(3)} />
      </section>

      {/* Step 3: Intent Input */}
      <section className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[#121217]/80 backdrop-blur-xl p-6 shadow-2xl">
        <div>
          <h2 className="text-xl font-bold text-white">
            {history.length === 0 ? "What do you want to achieve?" : "Refine your recommendation"}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Describe your financial goal in plain language (e.g. &quot;I want low-risk passive income from my USDC&quot;)
          </p>
        </div>
        <IntentForm history={history} onResult={handleIntentResult} />
      </section>

      {/* Step 4: AI Strategy Recommendations */}
      {result && (
        <section className="flex flex-col gap-4">
          <RecommendationCard result={result} onSelectStrategy={handleSelectStrategy} />
        </section>
      )}

      {/* Step 5: Route Preview Modal */}
      {selectedStrategy && (
        <RoutePreviewModal
          recommendation={selectedStrategy}
          quote={quote}
          loadingQuote={loadingQuote}
          errorQuote={errorQuote}
          onConfirm={handleExecuteRoute}
          onClose={() => setSelectedStrategy(null)}
        />
      )}

      {/* Step 6: Execution Status Tracker */}
      {txStatus.step !== "idle" && <TxStatusCard status={txStatus} onReset={handleResetFlow} />}

      <footer className="pb-8 text-center text-xs text-neutral-500 font-mono-tech">
        Every price, yield, and recommendation above is live or clearly-labeled simulated fallback data.
        Non-custodial route execution via LI.FI &amp; EVM wallets.
      </footer>
    </main>
  );
}
