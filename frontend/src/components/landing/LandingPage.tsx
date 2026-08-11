"use client";

import { DynamicGlobe } from "./DynamicGlobe";
import { LandingNavbar } from "./LandingNavbar";

interface LandingPageProps {
  onLaunchApp: () => void;
}

export function LandingPage({ onLaunchApp }: LandingPageProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-ivory selection:bg-accent selection:text-obsidian font-display">
      {/* 1. Minimal Fintech Navbar */}
      <LandingNavbar onLaunchApp={onLaunchApp} />

      {/* 2. Hero Section */}
      <section className="relative flex flex-col items-center px-4 pt-20 pb-0 text-center">
        {/* Large Editorial Headline */}
        <h1 className="max-w-4xl text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[1.05] text-ivory">
          Move your assets <br />
          <span className="lifi-text-gradient">with intent.</span>
        </h1>

        {/* Short Subheading Description */}
        <p className="mt-6 max-w-2xl text-base sm:text-lg text-neutral-300 font-medium leading-relaxed">
          AssetRouter understands your goal, discovers opportunities across chains, and helps you choose the best path for your assets.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 z-20 relative">
          <button
            type="button"
            onClick={onLaunchApp}
            className="rounded-xl bg-ivory px-8 py-3.5 text-sm font-mono-tech font-bold text-obsidian shadow-lg hover:bg-neutral-200 transition-all hover:scale-105"
          >
            Launch AssetRouter →
          </button>
          <button
            type="button"
            onClick={() => {
              onLaunchApp();
              // Slight delay so the app mounts, then auto-fill the intent
              setTimeout(() => {
                const ta = document.querySelector<HTMLTextAreaElement>("textarea");
                if (ta) {
                  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype,
                    "value"
                  )?.set;
                  nativeInputValueSetter?.call(ta, "What can I do with my XRP on Flare?");
                  ta.dispatchEvent(new Event("input", { bubbles: true }));
                  ta.focus();
                }
              }, 300);
            }}
            className="rounded-xl border border-amber/40 bg-amber/10 px-8 py-3.5 text-sm font-mono-tech font-medium text-amber hover:border-amber/60 hover:bg-amber/20 transition-colors"
          >
            ⚡ Have XRP? Explore Flare →
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("how-it-works")}
            className="rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-mono-tech font-medium text-ivory hover:border-white/40 hover:bg-white/10 transition-colors"
          >
            See how it works ↓
          </button>
        </div>
      </section>

      {/* Globe: full viewport width, no container constraints, seamless */}
      <div className="w-full relative z-10 -mt-4">
        <DynamicGlobe />
      </div>

      {/* 3. Product Section */}
      <section id="product" className="relative z-20 mx-auto max-w-6xl px-4 pt-24 pb-24 border-t border-white/10">
        <div className="flex flex-col items-center text-center gap-3 mb-16">
          <span className="text-xs font-mono-tech uppercase tracking-widest text-accent font-bold">
            Product Capabilities
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-ivory">
            Institutional asset routing engine
          </h2>
          <p className="max-w-xl text-sm text-neutral-400">
            Translating complex natural language financial goals into verified multi-chain execution paths.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 bg-panel/70 p-8 flex flex-col gap-4 backdrop-blur-xl">
            <span className="text-2xl">🧠</span>
            <h3 className="text-xl font-bold text-ivory">AI Intent Parsing</h3>
            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              Describe target yield, risk tolerance, and asset constraints in plain language. LLM reasoning parses parameters into structured execution schemas.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-panel/70 p-8 flex flex-col gap-4 backdrop-blur-xl">
            <span className="text-2xl">⚡</span>
            <h3 className="text-xl font-bold text-ivory">Flare FTSOv2 Oracle Data</h3>
            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              Real-time decentralized price feed attestation ensuring pricing accuracy and collateral valuation safety across all active routes.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-panel/70 p-8 flex flex-col gap-4 backdrop-blur-xl">
            <span className="text-2xl">🔗</span>
            <h3 className="text-xl font-bold text-ivory">Multi-Chain LI.FI Aggregation</h3>
            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              Cross-chain DEX and bridge liquidity routing across Ethereum, Flare, Arbitrum, Avalanche, Polygon, and Base.
            </p>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="mx-auto max-w-4xl px-4 py-24 border-t border-white/10">
        <div className="flex flex-col items-center text-center gap-3 mb-16">
          <span className="text-xs font-mono-tech uppercase tracking-widest text-amber font-bold">
            Workflow Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-ivory">
            How AssetRouter Works
          </h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121217]/90 p-8 font-mono-tech text-xs sm:text-sm max-w-xl mx-auto shadow-2xl">
          <div className="flex flex-col items-start gap-4 font-mono-tech">
            <div className="w-full rounded-xl border border-white/10 bg-white/5 p-4">
              <span className="text-neutral-400 text-xs block">Wallet</span>
              <strong className="text-base font-bold text-white block mt-0.5">5,000 FLR</strong>
            </div>

            <div className="w-full text-center text-neutral-500 font-bold text-sm">↓</div>

            <div className="w-full rounded-xl border border-accent/40 bg-accent/10 p-4">
              <span className="text-accent text-xs font-bold block">FTSOv2</span>
              <strong className="text-sm font-bold text-accent block mt-0.5">FLR/USD = $0.0061</strong>
            </div>

            <div className="w-full text-center text-neutral-500 font-bold text-sm">↓</div>

            <div className="w-full rounded-xl border border-white/10 bg-white/5 p-4">
              <span className="text-neutral-300 font-medium">Portfolio value = <strong className="text-white font-bold">$30.50</strong></span>
            </div>

            <div className="w-full text-center text-neutral-500 font-bold text-sm">↓</div>

            <div className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-neutral-300 font-medium">
              Yield opportunities
            </div>

            <div className="w-full text-center text-neutral-500 font-bold text-sm">↓</div>

            <div className="w-full rounded-xl border border-amber/40 bg-amber/10 p-4 text-amber font-bold">
              AI ranking
            </div>

            <div className="w-full text-center text-neutral-500 font-bold text-sm">↓</div>

            <div className="w-full rounded-xl border border-success/40 bg-success/15 p-4 text-emerald-400 font-bold">
              Recommendation
            </div>
          </div>
        </div>
      </section>

      {/* 5. Technology Section */}
      <section id="technology" className="mx-auto max-w-5xl px-4 py-24 border-t border-white/10">
        <div className="flex flex-col items-center text-center gap-3 mb-16">
          <span className="text-xs font-mono-tech uppercase tracking-widest text-accent font-bold">
            Infrastructure Layer
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-ivory">
            Oracle-backed routing stack
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono-tech">
          <div className="rounded-2xl border border-white/10 bg-panel/80 p-6 flex flex-col gap-3">
            <span className="text-accent font-bold text-sm">FLARE FTSOv2 ORACLE PRICE FEEDS</span>
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              Decentralized, sub-second native price feeds ensuring real-time portfolio valuation and collateral safety.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-panel/80 p-6 flex flex-col gap-3">
            <span className="text-amber font-bold text-sm">LI.FI DEX &amp; BRIDGE ENGINE</span>
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              Unified cross-chain bridge and swap routing API optimizing transaction paths for minimum gas and maximum yield retention.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Ecosystem Section */}
      <section id="ecosystem" className="mx-auto max-w-5xl px-4 py-24 border-t border-white/10">
        <div className="flex flex-col items-center text-center gap-3 mb-16">
          <span className="text-xs font-mono-tech uppercase tracking-widest text-success font-bold">
            Integrated Ecosystem
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-ivory">
            One intelligence layer. Multiple sources.
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono-tech text-xs">
          <div className="rounded-xl border border-white/10 bg-panel p-4 text-center text-ivory font-bold">
            Flare FTSOv2
          </div>
          <div className="rounded-xl border border-white/10 bg-panel p-4 text-center text-ivory font-bold">
            LI.FI SDK
          </div>
          <div className="rounded-xl border border-white/10 bg-panel p-4 text-center text-ivory font-bold">
            DeFiLlama
          </div>
          <div className="rounded-xl border border-white/10 bg-panel p-4 text-center text-ivory font-bold">
            OpenRouter
          </div>
        </div>
      </section>

      {/* 7. Final CTA Section */}
      <section className="mx-auto max-w-4xl px-4 py-28 border-t border-white/10">
        <div className="flex flex-col items-center text-center gap-8">
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-ivory max-w-2xl leading-tight">
            Tell AssetRouter what you want to achieve.
          </h2>
          <button
            type="button"
            onClick={onLaunchApp}
            className="rounded-xl bg-ivory px-9 py-4 text-base font-mono-tech font-bold text-obsidian shadow-2xl hover:bg-neutral-200 transition-all hover:scale-105"
          >
            Launch AssetRouter →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-neutral-400 font-mono-tech">
        <p>© 2026 AssetRouter · Web3 Infrastructure Engine</p>
      </footer>
    </div>
  );
}
