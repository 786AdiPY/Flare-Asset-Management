"use client";

import type { MouseEvent, ReactNode } from "react";
import { useInView } from "./useInView";

const ACCENTS = {
  sage: { text: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  amber: { text: "text-amber", bg: "bg-amber/10", border: "border-amber/20" },
  success: { text: "text-success", bg: "bg-success/10", border: "border-success/20" },
  brand: { text: "text-brand", bg: "bg-brand/10", border: "border-brand/20" },
} as const;

type Accent = keyof typeof ACCENTS;

interface EcosystemBadgeProps {
  icon: ReactNode;
  name: string;
  description: string;
  accent?: Accent;
  index: number;
}

export function EcosystemBadge({ icon, name, description, accent = "sage", index }: EcosystemBadgeProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const a = ACCENTS[accent];

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      style={{ transitionDelay: inView ? `${index * 80}ms` : "0ms" }}
      className={`group relative overflow-hidden rounded-xl border border-white/10 bg-panel p-4 flex flex-col items-center gap-2 text-center
        transition-[opacity,transform,border-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:-translate-y-0.5 hover:border-white/25
        motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(220px circle at var(--x, 50%) var(--y, 50%), rgba(244,241,234,0.06), transparent 55%)",
        }}
      />

      <div
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-transform duration-300 group-hover:scale-105 ${a.border} ${a.bg} ${a.text}`}
      >
        {icon}
      </div>
      <span className="relative text-ivory font-bold text-xs">{name}</span>
      <span className="relative text-[10px] text-neutral-500 leading-snug">{description}</span>
    </div>
  );
}
