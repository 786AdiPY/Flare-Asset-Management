"use client";

import { useMemo, useState, type PointerEvent } from "react";

interface Point {
  date: string;
  value: number | null;
}

interface SparklineProps {
  points: Point[];
  unit?: string;
  color?: "green" | "blue";
  width?: number;
  height?: number;
}

export function Sparkline({
  points,
  unit = "%",
  color = "green",
  width = 340,
  height = 70,
}: SparklineProps) {
  const clean = useMemo(
    () => points.filter((p) => p.value != null) as { date: string; value: number }[],
    [points]
  );
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (clean.length < 2) {
    return <div className="text-xs text-neutral-600 font-mono-tech py-4">Not enough history to chart.</div>;
  }

  const values = clean.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 8;

  const xStep = (width - pad * 2) / (clean.length - 1);
  const coords = clean.map((p, i) => ({
    x: pad + i * xStep,
    y: height - pad - ((p.value - min) / range) * (height - pad * 2),
    ...p,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(2)},${height - pad} L${coords[0].x.toFixed(
    2
  )},${height - pad} Z`;

  const hovered = hoverIdx != null ? coords[hoverIdx] : null;

  const strokeHex = color === "blue" ? "#3b82f6" : "#22c55e";
  const gradId = `sparkline-grad-${color}-${Math.random().toString(36).substr(2, 6)}`;

  function handlePointerMove(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let nearestDist = Infinity;
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  }

  return (
    <div className="relative w-full">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIdx(null)}
        className="overflow-visible"
        role="img"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeHex} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeHex} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={strokeHex} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle
          cx={coords[coords.length - 1].x}
          cy={coords[coords.length - 1].y}
          r={3.5}
          fill={strokeHex}
          stroke="#09090c"
          strokeWidth={1.5}
        />
        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={pad}
              y2={height - pad}
              stroke="currentColor"
              strokeOpacity={0.25}
              strokeWidth={1}
            />
            <circle cx={hovered.x} cy={hovered.y} r={4} fill={strokeHex} stroke="#09090c" strokeWidth={2} />
          </>
        )}
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-white/10 bg-[#121217] px-2 py-1 text-[11px] shadow-lg font-mono-tech"
          style={{ left: `${(hovered.x / width) * 100}%` }}
        >
          <span className="font-bold text-white">
            {hovered.value.toFixed(2)}
            {unit}
          </span>{" "}
          <span className="text-neutral-400 font-normal">{hovered.date}</span>
        </div>
      )}
    </div>
  );
}
