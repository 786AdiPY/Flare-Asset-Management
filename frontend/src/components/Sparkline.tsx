"use client";

import { useMemo, useState, type PointerEvent } from "react";

interface Point {
  date: string;
  value: number | null;
}

const WIDTH = 240;
const HEIGHT = 56;
const PAD = 6;

export function Sparkline({ points, unit = "%" }: { points: Point[]; unit?: string }) {
  const clean = useMemo(() => points.filter((p) => p.value != null) as { date: string; value: number }[], [
    points,
  ]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (clean.length < 2) {
    return <div className="text-xs text-neutral-600">Not enough history to chart.</div>;
  }

  const values = clean.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const xStep = (WIDTH - PAD * 2) / (clean.length - 1);
  const coords = clean.map((p, i) => ({
    x: PAD + i * xStep,
    y: HEIGHT - PAD - ((p.value - min) / range) * (HEIGHT - PAD * 2),
    ...p,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(2)},${HEIGHT - PAD} L${coords[0].x.toFixed(
    2
  )},${HEIGHT - PAD} Z`;

  const hovered = hoverIdx != null ? coords[hoverIdx] : null;

  function handlePointerMove(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
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
    <div className="relative inline-block">
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIdx(null)}
        className="overflow-visible"
        role="img"
        aria-label={`Sparkline of ${clean.length} data points, from ${values[0].toFixed(2)}${unit} to ${values[
          values.length - 1
        ].toFixed(2)}${unit}`}
      >
        <path d={areaPath} fill="#3ddc97" opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke="#3ddc97" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle
          cx={coords[coords.length - 1].x}
          cy={coords[coords.length - 1].y}
          r={4}
          fill="#3ddc97"
          stroke="#121821"
          strokeWidth={2}
        />
        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PAD}
              y2={HEIGHT - PAD}
              stroke="currentColor"
              strokeOpacity={0.25}
              strokeWidth={1}
            />
            <circle cx={hovered.x} cy={hovered.y} r={4} fill="#3ddc97" stroke="#121821" strokeWidth={2} />
          </>
        )}
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-panel px-2 py-1 text-xs shadow-lg"
          style={{ left: hovered.x }}
        >
          <span className="font-semibold text-neutral-100">
            {hovered.value.toFixed(2)}
            {unit}
          </span>{" "}
          <span className="text-neutral-500">{hovered.date}</span>
        </div>
      )}
    </div>
  );
}
