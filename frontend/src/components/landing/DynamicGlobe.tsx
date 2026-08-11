"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import type { Arc } from "cobe";

const MARKER_DATA = [
  { lat: 48.8566, lng: 2.3522, label: "FLR — Flare FTSOv2" },
  { lat: 40.7128, lng: -74.006, label: "ETH — Ethereum Mainnet" },
  { lat: 37.7749, lng: -122.4194, label: "USDC — Base L2" },
  { lat: 51.5074, lng: -0.1278, label: "BTC — Arbitrum One" },
  { lat: 35.6762, lng: 139.65, label: "AVAX — Avalanche C-Chain" },
];

const ALL_ARCS: Arc[] = [
  { from: [40.7128, -74.006], to: [48.8566, 2.3522], color: [0.85, 0.85, 0.85] },
  { from: [48.8566, 2.3522], to: [37.7749, -122.4194], color: [0.85, 0.85, 0.85] },
  { from: [40.7128, -74.006], to: [51.5074, -0.1278], color: [0.85, 0.85, 0.85] },
  { from: [48.8566, 2.3522], to: [35.6762, 139.65], color: [0.85, 0.85, 0.85] },
];

function projectMarker(
  lat: number,
  lng: number,
  phi: number,
  theta: number,
  cssW: number,
  cssH: number,
  scale: number,
  offX: number,
  offY: number
): { x: number; y: number; visible: boolean } {
  const lr = (lat * Math.PI) / 180;
  const gr = (lng * Math.PI) / 180;

  let x = Math.cos(lr) * Math.sin(gr);
  let y = Math.sin(lr);
  let z = Math.cos(lr) * Math.cos(gr);

  const cp = Math.cos(phi),
    sp = Math.sin(phi);
  const x1 = x * cp + z * sp;
  const z1 = -x * sp + z * cp;

  const ct = Math.cos(theta),
    st = Math.sin(theta);
  const y1 = y * ct - z1 * st;
  const z2 = y * st + z1 * ct;

  const r = Math.min(cssW, cssH) * scale * 0.5;
  const cx = cssW / 2 + offX;
  const cy = cssH / 2 + offY;

  return { x: cx + x1 * r, y: cy - y1 * r, visible: z2 > 0 };
}

export function DynamicGlobe() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoverTargetRefs = useRef<(HTMLDivElement | null)[]>([]);

  const phiRef = useRef(0.8);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    let vw = window.innerWidth;
    let cW = vw * dpr;
    let cH = Math.round(vw * 0.65 * dpr);
    const SCALE = 1.8;
    const THETA = 0.25;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: cW,
      height: cH,
      phi: 0.8,
      theta: THETA,
      dark: 1,
      diffuse: 1.35,
      scale: SCALE,
      offset: [0, cH * 0.28],
      mapSamples: 24000,
      mapBrightness: 4.8,
      baseColor: [0.06, 0.08, 0.1],
      markerColor: [0.85, 0.85, 0.85],
      glowColor: [0.12, 0.14, 0.18],
      markers: MARKER_DATA.map((m) => ({
        location: [m.lat, m.lng] as [number, number],
        size: 0.008, // Small crisp dot
      })),
      arcs: [ALL_ARCS[0]],
      arcColor: [0.85, 0.85, 0.85],
      arcWidth: 0.05,
      arcHeight: 0.2,
    });

    // Cycle route arcs
    let arcIdx = 0;
    const arcTimer = setInterval(() => {
      arcIdx = (arcIdx + 1) % ALL_ARCS.length;
      globe.update({ arcs: [ALL_ARCS[arcIdx]] });
    }, 3000);

    // Continuous smooth animation loop
    let animId: number;
    const loop = () => {
      if (!isDraggingRef.current) {
        phiRef.current += 0.002;
      }
      globe.update({ phi: phiRef.current });

      const cssW = cW / dpr;
      const cssH = cH / dpr;
      const offYcss = (cH * 0.28) / dpr;

      MARKER_DATA.forEach((m, i) => {
        const el = hoverTargetRefs.current[i];
        if (!el) return;
        const pos = projectMarker(
          m.lat,
          m.lng,
          phiRef.current,
          THETA,
          cssW,
          cssH,
          SCALE,
          0,
          offYcss
        );
        if (pos.visible && pos.y > 0 && pos.y < cssH) {
          el.style.left = `${pos.x}px`;
          el.style.top = `${pos.y}px`;
          el.style.opacity = "1";
          el.style.display = "block";
        } else {
          el.style.opacity = "0";
          el.style.display = "none";
        }
      });

      animId = requestAnimationFrame(loop);
    };
    loop();

    // Window-level mouse/touch drag handlers for 100% reliable rotation anywhere
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      lastXRef.current = e.clientX;
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - lastXRef.current;
        lastXRef.current = e.clientX;
        phiRef.current += deltaX * 0.004;
      }
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("pointerdown", onPointerDown);
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Scroll rotation
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const sy = window.scrollY;
      phiRef.current += (sy - lastScrollY) * 0.0003;
      lastScrollY = sy;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Resize
    const onResize = () => {
      vw = window.innerWidth;
      cW = vw * dpr;
      cH = Math.round(vw * 0.65 * dpr);
      globe.update({
        width: cW,
        height: cH,
        scale: SCALE,
        offset: [0, cH * 0.28],
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(arcTimer);
      globe.destroy();
      if (container) {
        container.removeEventListener("pointerdown", onPointerDown);
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none -mb-16 touch-none"
    >
      <canvas
        ref={canvasRef}
        className="block w-full cursor-grab active:cursor-grabbing"
      />

      {/* Hover target overlays over projected dot positions */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
        {MARKER_DATA.map((m, i) => (
          <div
            key={m.label}
            ref={(el) => {
              hoverTargetRefs.current[i] = el;
            }}
            className="absolute pointer-events-auto cursor-pointer -translate-x-1/2 -translate-y-1/2 group"
            style={{ top: 0, left: 0, width: "36px", height: "36px" }}
          >
            {/* Soft pulse/hover ring around dot */}
            <div className="absolute inset-1.5 rounded-full border border-white/40 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

            {/* Currency badge tooltip – pops up cleanly when hovering cursor over dot */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-30">
              <div className="px-3 py-1.5 rounded-lg border border-white/30 bg-[#0B0F12]/95 backdrop-blur-md shadow-2xl flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono-tech font-bold tracking-wider text-ivory">
                  {m.label}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Fade */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0B0F12] via-[#0B0F12]/80 to-transparent pointer-events-none z-10" />
    </div>
  );
}
