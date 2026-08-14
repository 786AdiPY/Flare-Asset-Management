"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Tone = "neutral" | "accent" | "amber" | "success";

const TONES: Record<Tone, { text: string; ghost: string; glow: string; borderActive: string; shadow: string }> = {
  neutral: {
    text: "text-neutral-400",
    ghost: "text-white/10",
    glow: "bg-white/25",
    borderActive: "border-white/25",
    shadow: "shadow-[0_0_60px_-8px_rgba(244,241,234,0.35)]",
  },
  accent: {
    text: "text-accent",
    ghost: "text-accent/10",
    glow: "bg-accent/50",
    borderActive: "border-accent/50",
    shadow: "shadow-[0_0_60px_-8px_rgba(178,200,186,0.5)]",
  },
  amber: {
    text: "text-amber",
    ghost: "text-amber/10",
    glow: "bg-amber/50",
    borderActive: "border-amber/50",
    shadow: "shadow-[0_0_60px_-8px_rgba(217,172,98,0.5)]",
  },
  success: {
    text: "text-success",
    ghost: "text-success/10",
    glow: "bg-success/50",
    borderActive: "border-success/50",
    shadow: "shadow-[0_0_60px_-8px_rgba(135,169,107,0.5)]",
  },
};

interface Chapter {
  id: string;
  eyebrow: string;
  headline: string;
  narrative: string;
  tone: Tone;
  visual: ReactNode;
}

const CHAPTERS: Chapter[] = [
  {
    id: "01",
    eyebrow: "Input",
    headline: "Describe the goal in plain language",
    narrative:
      "No forms, no dropdowns. A wallet holding 5,000 FLR states its intent, and AssetRouter parses it directly.",
    tone: "neutral",
    visual: (
      <>
        <span className="text-neutral-400 text-xs block">Wallet</span>
        <strong className="text-lg font-bold text-white block mt-1">5,000 FLR</strong>
      </>
    ),
  },
  {
    id: "02",
    eyebrow: "Oracle",
    headline: "Ground it in a live price feed",
    narrative:
      "Flare's FTSOv2 decentralized oracle attests FLR/USD in real time, so every number downstream is priced against verified market data, not a stale API.",
    tone: "accent",
    visual: (
      <>
        <span className="text-accent text-xs font-bold block">FTSOv2</span>
        <strong className="text-base font-bold text-accent block mt-1">FLR/USD = $0.0061</strong>
      </>
    ),
  },
  {
    id: "03",
    eyebrow: "Valuation",
    headline: "Turn holdings into a number",
    narrative:
      "The position is converted into a single portfolio valuation — the baseline every recommendation gets measured against.",
    tone: "neutral",
    visual: (
      <span className="text-neutral-300 font-medium">
        Portfolio value = <strong className="text-white font-bold">$30.50</strong>
      </span>
    ),
  },
  {
    id: "04",
    eyebrow: "Discovery",
    headline: "Scan the opportunity set",
    narrative:
      "LI.FI and DeFiLlama surface yield and routing opportunities across chains — the raw candidates for what to do next.",
    tone: "neutral",
    visual: (
      <>
        <span className="text-neutral-300 font-medium block mb-2">Yield opportunities</span>
        <div className="flex flex-wrap gap-1.5">
          {["Flare", "Base", "Arbitrum"].map((chain) => (
            <span
              key={chain}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-neutral-400"
            >
              {chain}
            </span>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "05",
    eyebrow: "Reasoning",
    headline: "Rank the tradeoffs",
    narrative:
      "An LLM reasons over risk, yield, and execution cost to rank the candidates — not just the highest headline APY.",
    tone: "amber",
    visual: <span className="text-amber font-bold">AI ranking</span>,
  },
  {
    id: "06",
    eyebrow: "Output",
    headline: "Deliver one clear answer",
    narrative: "The result is a single, explainable recommendation the user can act on immediately.",
    tone: "success",
    visual: <span className="text-emerald-400 font-bold">Recommendation</span>,
  },
];

function VisualCard({ tone, active, children }: { tone: Tone; active: boolean; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <div className="relative">
      {/* Ambient glow — blooms in only while this step is in focus */}
      <div
        aria-hidden
        className={`absolute -inset-8 rounded-[2rem] blur-3xl transition-opacity duration-700 ${t.glow} ${
          active ? "opacity-60 animate-pulse" : "opacity-0"
        }`}
      />
      {/* Glass card */}
      <div
        className={`relative rounded-2xl border backdrop-blur-xl p-5 w-full max-w-[280px] font-mono-tech text-xs sm:text-sm transition-all duration-500 ${
          active ? `${t.borderActive} bg-white/[0.07] ${t.shadow}` : "border-white/10 bg-white/[0.04]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function WorkflowNarrative() {
  const [active, setActive] = useState(0);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = chapterRefs.current.map((el, i) => {
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(i);
        },
        { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  return (
    <div className="grid md:grid-cols-[190px_1fr] gap-10 md:gap-16">
      {/* Sticky step rail */}
      <div className="hidden md:block">
        <div className="sticky top-32 flex flex-col gap-1">
          {CHAPTERS.map((c, i) => {
            const isActive = active === i;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  chapterRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-left transition-colors duration-300 ${
                  isActive ? "bg-white/5" : "hover:bg-white/[0.03]"
                }`}
              >
                <span
                  className={`font-mono-tech text-xs sm:text-sm font-bold transition-colors duration-300 ${
                    isActive ? TONES[c.tone].text : "text-neutral-500"
                  }`}
                >
                  {c.id}
                </span>
                <span
                  className={`font-mono-tech text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
                    isActive ? "text-ivory" : "text-neutral-500"
                  }`}
                >
                  {c.eyebrow}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Narrative chapters — copy stays fully readable throughout; the glow card carries the focus cue */}
      <div className="flex flex-col gap-20 sm:gap-28">
        {CHAPTERS.map((c, i) => {
          const isActive = active === i;
          const t = TONES[c.tone];
          return (
            <div
              key={c.id}
              ref={(el) => {
                chapterRefs.current[i] = el;
              }}
              className={`flex flex-col gap-8 md:flex-row md:items-center ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
            >
              <div className="flex-1 relative">
                <span
                  aria-hidden
                  className={`pointer-events-none absolute -top-8 -left-1 text-7xl sm:text-8xl font-black select-none transition-colors duration-700 ${t.ghost}`}
                >
                  {c.id}
                </span>
                <span className={`relative block text-xs sm:text-sm font-mono-tech font-bold uppercase tracking-widest mb-3 ${t.text}`}>
                  {c.eyebrow}
                </span>
                <h3 className="relative text-2xl sm:text-3xl font-bold text-ivory tracking-tight mb-3 max-w-sm">
                  {c.headline}
                </h3>
                <p className="relative text-sm sm:text-base text-neutral-300 leading-relaxed max-w-md">{c.narrative}</p>
              </div>

              <div className="flex flex-1 md:justify-center">
                <VisualCard tone={c.tone} active={isActive}>
                  {c.visual}
                </VisualCard>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
