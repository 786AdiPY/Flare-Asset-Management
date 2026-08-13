"use client";

import type { MouseEvent, ReactNode } from "react";
import { useInView } from "./useInView";

const ACCENTS = {
  sage: { text: "text-accent", bg: "bg-accent/10", border: "border-accent/20", bar: "bg-accent" },
  amber: { text: "text-amber", bg: "bg-amber/10", border: "border-amber/20", bar: "bg-amber" },
  success: { text: "text-success", bg: "bg-success/10", border: "border-success/20", bar: "bg-success" },
  brand: { text: "text-brand", bg: "bg-brand/10", border: "border-brand/20", bar: "bg-brand" },
} as const;

type Accent = keyof typeof ACCENTS;

interface ProductCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  tags?: string[];
  accent?: Accent;
  index: number;
}

export function ProductCard({ icon, title, description, tags, accent = "sage", index }: ProductCardProps) {
  const { ref, inView: visible } = useInView<HTMLDivElement>();
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
      style={{ transitionDelay: visible ? `${index * 90}ms` : "0ms" }}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-panel/70 p-8 flex flex-col gap-4 backdrop-blur-xl
        transition-[opacity,transform,border-color,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:-translate-y-1 hover:border-white/20 hover:shadow-glass
        motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      {/* Top accent line — fills in from center on hover */}
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-px origin-center scale-x-0 opacity-80 transition-transform duration-500 ease-out group-hover:scale-x-100 ${a.bar}`}
      />

      {/* Cursor-follow spotlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(480px circle at var(--x, 50%) var(--y, 50%), rgba(244,241,234,0.06), transparent 45%)",
        }}
      />

      <div
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105 ${a.border} ${a.bg} ${a.text}`}
      >
        {icon}
      </div>

      <h3 className="relative text-xl font-bold text-ivory">{title}</h3>
      <p className="relative text-xs text-neutral-300 leading-relaxed font-sans">{description}</p>

      {tags && tags.length > 0 && (
        <div className="relative flex flex-wrap gap-1.5 pt-1 opacity-0 -translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 motion-reduce:opacity-100 motion-reduce:translate-y-0">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono-tech tracking-wide text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
