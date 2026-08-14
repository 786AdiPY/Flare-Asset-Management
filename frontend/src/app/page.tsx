"use client";

import { Suspense, useEffect, useState } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { NavBar } from "@/components/NavBar";
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
import { FAssetsCard } from "@/components/FAssetsCard";


export default function Home() {
  const { walletAddress } = useWalletContext();
  const { sendTransaction } = useWallet();

  const [view, setView] = useState<"landing" | "app">("landing");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [result, setResult] = useState<IntentResponse | null>(null);
  const [isXrpIntent, setIsXrpIntent] = useState(false);
  const [xrpAmount, setXrpAmount] = useState("");


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
    setCurrentStep(4);
    // Detect XRP-related intent to show FAssets card
    const xrpKw = ["xrp", "fxrp", "fasset", "ftestxrp"];
    setIsXrpIntent(xrpKw.some((k) => userText.toLowerCase().includes(k)));
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
    const currentRec = selectedStrategy;
    const amount = currentRec.suggestedAmount || "1,000";

    setCurrentStep(6); // Move to Execution step
    setTxStatus({
      step: "signing",
      simulated: quote?.simulated,
      recommendation: currentRec,
      amount,
    });

    try {
      let txHash = "";

      if (
        typeof window !== "undefined" &&
        window.ethereum &&
        walletAddress &&
        !walletAddress.includes("DEM0") &&
        quote?.transactionRequest
      ) {
        setTxStatus({
          step: "signing",
          recommendation: currentRec,
          amount,
        });
        txHash = await sendTransaction({
          to: quote.transactionRequest.to,
          data: quote.transactionRequest.data,
          value: quote.transactionRequest.value,
          gasLimit: quote.transactionRequest.gasLimit,
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setTxStatus({
          step: "broadcasting",
          simulated: true,
          recommendation: currentRec,
          amount,
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      }

      setTxStatus({
        step: "confirmed",
        txHash,
        simulated: quote?.simulated ?? true,
        recommendation: currentRec,
        amount,
      });
      setSelectedStrategy(null);
    } catch (err) {
      setTxStatus({
        step: "error",
        error: err instanceof Error ? err.message : "Transaction execution failed",
        recommendation: currentRec,
        amount,
      });
    }
  }

  function handleResetFlow() {
    setSelectedStrategy(null);
    setQuote(null);
    setResult(null);
    setHistory([]);
    setTxStatus({ step: "idle" });
    setCurrentStep(walletAddress ? 3 : 1);
  }

  // Check URL query parameter on mount for view=app
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "app") {
        setView("app");
      }
    }
  }, []);

  if (view === "landing") {
    return <LandingPage onLaunchApp={() => setView("app")} />;
  }

  return (
    <div className="min-h-screen bg-obsidian text-ivory">
      {/* Top App Navigation Bar (Router, Holdings & Alerts, Yields, Feeds, Connect Wallet) */}
      <NavBar
        onRouterClick={() => setView("app")}
        onLandingClick={() => setView("landing")}
      />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 pb-16 pt-4">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-ivory font-display">
            Intent <span className="lifi-text-gradient">AssetRouter</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-400 font-medium">
            Non-custodial Intent Router for Tokenized Real-World Assets · Powered by Flare FTSO &amp; LI.FI Routing
          </p>
        </div>

        <PriceTicker />

      {/* Step 3: Intent Input */}
      <section className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory">
            {history.length === 0 ? "What do you want to achieve?" : "Refine your recommendation"}
          </h2>
          <p className="text-sm sm:text-base text-neutral-300 font-medium mt-1 leading-relaxed">
            Describe your financial goal in plain language (e.g. &quot;I want low-risk passive income from my USDC&quot;)
          </p>
        </div>
        <Suspense fallback={<div className="text-xs text-neutral-400 font-mono-tech">Loading router engine...</div>}>
          <IntentForm history={history} onResult={handleIntentResult} />
        </Suspense>
      </section>

      {/* Step 4: AI Strategy Recommendations */}
      {result && txStatus.step === "idle" && (
        <section className="flex flex-col gap-4">
          <RecommendationCard result={result} onSelectStrategy={handleSelectStrategy} />

          {/* Contextual FAssets card — shown only for XRP-related intents */}
          {isXrpIntent && (
            <FAssetsCard xrpAmount={xrpAmount || undefined} />
          )}
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

      <footer className="pb-8 text-center text-xs sm:text-sm text-neutral-400 font-mono-tech">
        Real-time price feeds &amp; yield analytics · Non-custodial route execution via LI.FI &amp; EVM wallets.
      </footer>
    </main>
    </div>
  );
}

